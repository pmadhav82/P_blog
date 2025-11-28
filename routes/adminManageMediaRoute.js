const express = require("express");
const firebase = require("../utils/firebase-admin-config");
const { islogin } = require("../utils/loginHandeler");
const isAdmin = require("../utils/adminHandeler");

const adminManageMediaRoute = express.Router();

const BUCKET_NAME = "pblog-5795d.firebasestorage.app";
const bucket = firebase.storage().bucket(BUCKET_NAME);

// GET /admin/manage-media -> render list of all firebase images
adminManageMediaRoute.get("/", async (req, res) => {
  try {
    // List all files in the bucket
    const [files] = await bucket.getFiles();

    // Map files to objects with name and publicUrl
    const BASE_URL = "https://storage.googleapis.com";
    const images = files.map((file) => ({
      name: file.name,
      publicUrl: `${BASE_URL}/${BUCKET_NAME}/${encodeURIComponent(file.name)}`,
    }));

    res.render("firebase-media", { images });
  } catch (error) {
    console.error(error.message);
    req.flash("error", "Failed to fetch images from Firebase storage");
    return res.redirect("/admin");
  }
});

// POST /admin/manage-media/:imageName -> delete the file
// POST /admin/manage-media/delete -> delete file by imageName in body
adminManageMediaRoute.post("/delete", async (req, res) => {
  const { imageName } = req.body;

  try {
    const file = bucket.file(imageName);
    await file.delete();
    req.flash("success", "Image deleted successfully");
  } catch (error) {
    console.error(error.message);
    req.flash("error", "Failed to delete the image");
  }

  res.redirect("/admin/manage-media");
});

module.exports = adminManageMediaRoute;
