const firebase = require("firebase-admin");
const serviceAccount = require("../service-account-key.json");


const crypto = require("crypto");
const path = require("path");
const {islogin} = require("../utils/loginHandeler");
const express = require("express");
const multer = require("multer");


firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
});
const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const bucket = firebase.storage().bucket();

// Route to upload image
router.post("/upload", islogin, upload.single("image"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        // Generate a unique filename
        const filename = `${crypto.randomBytes(16).toString("hex")}${path.extname(req.file.originalname)}`;

        // Upload to Firebase Storage
        const file = bucket.file(filename);
        await file.save(req.file.buffer, {
            metadata: { contentType: req.file.mimetype },
            public: true,
        });

        // Get public URL
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

        // Save image info to Firestore
        const db = firebase.firestore();
        const docRef = await db.collection("images").add({
            url: publicUrl,
            uploadedAt: new Date(),
            user: req.user ? req.user.id : null,
        });

        res.json({ success: true, url: publicUrl, id: docRef.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;