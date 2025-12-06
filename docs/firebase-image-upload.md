# How to upload image to Firebase Storage from your expressjs app.

This write-up outlines how we implemented image uploading, listing, and deletion using Firebase Storage (via the Firebase Admin SDK) in the P_Blog project. The post documents the code, how it works, potential issues, and suggestions for improvement.

---

## Table of contents

- Overview
- Key components and files
- Upload middleware (Multer) setup
- Upload route (save file to Firebase Storage)
- Listing images (getFiles)
- Deleting images (file.delete)
- Frontend confirmation UX
- Security & Best practices
- Testing and verification
- Suggested improvements

---

## Overview

The process implemented in P_Blog is simple and robust for a small to medium-scale project:

1. User uploads an image via a form.
2. The server receives the image buffer using Multer (memory storage).
3. The server saves the image to Firebase Storage using the Admin SDK.
4. The uploaded file is made public (via `file.makePublic()`), so a public URL can be used in the site.
5. Admins can list and delete images using the Admin UI.

---

## Key files and their roles

- `utils/firebase-admin-config.js` — Initializes Firebase Admin SDK (service account). Exports the firebase object.
- `utils/firebaseImageUpload.js` — Multer configuration for image uploads (max size, memory storage, and fileFilter).
- `routes/firebaseUploadImageRoute.js` — Upload route that saves the image buffer into Firebase Storage and returns a public URL.
- `routes/adminManageMediaRoute.js` — Admin route for listing images (`GET /admin/manage-media`) and deleting images (`POST /admin/manage-media/delete`).
- `views/firebase-media.handlebars` — Admin HTML that lists images, displays an image modal, and a delete confirmation modal.

---

## Firebase Admin Setup

The Firebase Admin SDK is initialized in `utils/firebase-admin-config.js` using a service account JSON placed outside source control (`service-account-key.json`):

```js
const firebase = require("firebase-admin");
const serviceAccount = require("../service-account-key.json");
firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount)
});

module.exports = firebase;
```

This allows server-side operations (creating, deleting files and generating signed URLs) using your Firebase project credentials.

---

## Upload middleware (Multer)

We use Multer with memory storage because the Firebase Admin SDK accepts a Buffer as input. It's configured to limit file size and filter file types.

Key snippet (`utils/firebaseImageUpload.js`):

```js
const multer = require("multer");

const firebaseUpload = multer({
  limits: { fileSize: 12000000 }, // 12MB
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowedFileType = ["image/png", "image/jpg", "image/jpeg", "image/gif"];
    if (!allowedFileType.includes(file.mimetype)) {
      return cb(new Error("Please select a valid image file (PNG, JPG, JPEG, GIF)"), false);
    }
    cb(null, true);
  },
});

module.exports = firebaseUpload;
```

Note: For very large files, or to reduce memory usage, consider streaming uploads or a temporary storage hook. For the `memoryStorage()` approach this project uses, make sure your server memory can handle the largest eligible file and the concurrent requests you expect.

---

## Upload route — Saving to Firebase Storage

The upload route at `/firebase-image-upload` accepts a `POST` request with a `firebase-image` field (single file). It performs the following steps:

1. Verify the file exists in `req.file`.
2. Create a random filename using `crypto.randomBytes` and append the original extension (via `path.extname`).
3. Save the buffer using `file.save(req.file.buffer, ...)` with proper metadata.
4. Make the file public using `file.makePublic()` and return a public URL.

Key snippet (`routes/firebaseUploadImageRoute.js`):

```js
const firebase = require("../utils/firebase-admin-config");
const firebaseUpload = require("../utils/firebaseImageUpload");
const {islogin} = require("../utils/loginHandeler");
const path = require("path");
const crypto = require("crypto");
const firebaseImageUploadRoute = require("express").Router();

const BUCKET_NAME = "pblog-5795d.firebasestorage.app";
const bucket = firebase.storage().bucket(BUCKET_NAME);

firebaseImageUploadRoute.post(
  "/",
  islogin,
  firebaseUpload.single("firebase-image"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No image selected", success: false });
    }

    try {
      const fileExt = path.extname(req.file.originalname); // Keep leading dot if any.
      const fileName = `${crypto.randomBytes(16).toString("hex")}${fileExt}`; // NOTE: Avoid double dot.
      const file = bucket.file(fileName);

      await file.save(req.file.buffer, { metadata: { contentType: req.file.mimetype } });
      await file.makePublic();

      const BASE_URL = "https://storage.googleapis.com";
      const publicUrl = `${BASE_URL}/${BUCKET_NAME}/${fileName}`;

      res.json({ success: true, publicUrl });
    } catch (er) {
      res.status(500).json({ message: er.message, success: false });
    }
  }
);
```

Important improvement: use `fileName` without an extra `.` in the template. The code above demonstrates the corrected string concatenation.

**Note on `makePublic()`:** Calling `file.makePublic()` sets object ACL to be readable by anyone, making the file publicly accessible. If you want the image to be private, consider using signed URLs generated by Firebase: `file.getSignedUrl({ action: 'read', expires: '03-09-2491' })`.

---

## List images (Admin) — Reading the bucket

To list images the admin created a route at `GET /admin/manage-media` that calls `bucket.getFiles()` and passes the results to a view.

Key snippet (`routes/adminManageMediaRoute.js`):

```js
adminManageMediaRoute.get("/", async (req, res) => {
  const [files] = await bucket.getFiles();
  const BASE_URL = "https://storage.googleapis.com";
  const images = files.map((file) => ({
    name: file.name,
    publicUrl: `${BASE_URL}/${BUCKET_NAME}/${encodeURIComponent(file.name)}`,
  }));
  res.render("firebase-media", { images });
});
```

Notes:
- `getFiles()` returns an array for the first page of results by default. If you expect many files, implement pagination with `pageToken` and `maxResults`.
- We URL-encode the file name with `encodeURIComponent` for safe use in the URL.

---

## Delete images — Server-side logic

The admin view posts a delete form to `/admin/manage-media/delete` with `imageName` in the request body. The route deletes the file from the Firebase bucket.

Key snippet (`routes/adminManageMediaRoute.js`):

```js
adminManageMediaRoute.post("/delete", async (req, res) => {
  const { imageName } = req.body;

  try {
    const file = bucket.file(imageName);
    await file.delete();
    req.flash("success", "Image deleted successfully");
  } catch (error) {
    req.flash("error", "Failed to delete the image");
  }

  res.redirect("/admin/manage-media");
});
```

Safety notes:
- We use `req.body.imageName` rather than a path parameter because filenames may contain `/` characters and a request body avoids path parsing errors when filenames include slashes.
- The route is protected (only admins can reach it), but you might also validate that the `imageName` indeed exists and is not used by active posts — see suggested improvements.

---

## Frontend — Admin UI and confirmation UX

The admin UI template (`views/firebase-media.handlebars`) displays images in a gallery, provides a small preview modal, and a delete form for each image. On submit, a JS handler intercepts the form to show a delete confirmation modal. Confirming submits the original form — cancel closes the modal.

Key elements:

```handlebars
<form action="/admin/manage-media/delete" method="post">
  <input type="hidden" name="imageName" value="{{this.name}}" />
  <button class="btn-secondary" type="submit">Delete</button>
</form>
```

In our JS we intercept `submit` to show a modal with the filename and (optionally) an image preview. When an admin confirms, the form is submitted. This prevents accidental deletion and improves UX.

---

## Testing the flow locally

1. Start your server (make sure `service-account-key.json` is configured):
```bash
npm start
# or
node app.js
```
2. Log in as an admin and upload an image via the upload form. The server should return a `publicUrl` you can paste and verify.
3. Go to `/admin/manage-media` and verify the image appears.
4. Click `Delete` and confirm: image should be removed and the admin redirected back.

You can also test the upload with `curl` (include the correct session cookie for authentication):
```bash
curl -i -X POST -F "firebase-image=@/path/to/img.jpg" http://localhost:8000/firebase-image-upload
```

Delete using a POST form (again, this example requires the session cookie for admin):
```bash
curl -i -X POST -d "imageName=uploaded-file.jpg" -b "connect.sid=<SID>" http://localhost:8000/admin/manage-media/delete
```

---

## Security and Best practices

- Authentication/Authorization: The upload and management routes are protected with `islogin` and `isAdmin` middleware — keep this thorough.
- Public vs private: Check your application needs. If files should be private, use `file.getSignedUrl(...)` instead of `file.makePublic()`.
- Validate file names and prevent deletion of images used by posts. Introduce a DB check preventing delete if referenced.
- Limit file types and file sizes (done via Multer). Consider antivirus scanning if your project accepts user uploads from unknown sources.
- Use environment variables and secure storage for service account keys. Keep keys out of source control.

---

## Suggested improvements and future work

- Use signed URLs for private access.
- Add pagination for listing images when a bucket grows large.
- Add an image preview in the delete confirmation modal (improves UX and reduces accidental deletion).
- Convert the delete action to AJAX to avoid full page reloads and make the admin page more responsive.
- Add a `trash` mechanism: soft-deletes or move images to a `trash/` prefix and perform a permanent delete later.
- Protect soft-deleted images from being re-used and provide an audit trail for deletes.

---

## Final notes

Implementing files in Firebase Storage via the Admin SDK is straightforward and integrates well with Node/Express via Multer. The P_Blog implementation is production-ready for small projects, and with a few of the improvements suggested above you can scale safely and add more robust functionality (privacy, pagination, auditing).



