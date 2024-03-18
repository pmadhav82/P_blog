const express = require("express");
const router = express.Router();
const { validationResult } = require("express-validator");
const Users = require("../module/user");
const Posts = require("../module/posts");
const bcrypt = require("bcrypt");
const upload = require("../fileUpload");
const sendEmail = require("../utils/sendEmail");
const { generateToken, isValidToken } = require("../utils/tokenHandeler");
const { islogin } = require("../utils/loginHandeler");
// markedjs, dompurify and jsdom init
const createDomPurify = require("dompurify");
const { JSDOM } = require("jsdom");
const { marked } = require("marked");
const window = new JSDOM("").window;
const DOMPurify = createDomPurify(window);
const Comment = require("../module/comment");
const { postValidation } = require("../utils/userInputValidation");

// API to get blogs
router.get("/api/:email", async (req, res) => {
  let email = req.params.email;

  try {
    let user = await Users.findOne({ email });
    let blogs = await Posts.find({ uid: user._id })
      .populate({ path: "uid", select: "-password" })
      .sort({ _id: -1 })
      .lean();
    res.status(200).json(blogs);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
});

// Home Route
router.get("/", async (req, res) => {
  try {
    const posts = await Posts.find()
      .sort({ _id: -1 })
      .populate({ path: "uid", select: "_id name profileURL" })
      .lean();
    res.render("home", {
      posts,
    });
  } catch (err) {
    console.error(err);
  }
});

// Getting a single post
router.get("/:postId", async (req, res) => {
  const { postId } = req.params;

  try {
    const post = await Posts.findById({ _id: postId })
      .populate({ path: "uid", select: "-password" })
      .lean();

    const comments = await Comment.find({ postId, parentComment: null })
      .sort({ _id: 1 })
      .populate({ path: "replies" })
      .populate({ path: "postedBy", select: "-password" })
      .lean();
    if (post) {
      res.render("singlePost", {
        post,
        comments,
      });
    }
  } catch (er) {
    console.log(er);
  }
});

// protected routes begins
router.use(islogin);

//get routes
router.get("/welcome", async (req, res) => {
  try {
    const userId = req.session.uid;
    const posts = await Posts.find({ uid: userId })
      .populate("uid")
      .sort({ _id: -1 })
      .select()
      .lean();
    const user = await Users.findById(userId).lean();

    res.render("welcome", {
      user,
      posts,
      postNum: posts.length,
    });
  } catch (err) {
    console.log(err);
  }
});

// A user posts

router.get("/user", async (req, res) => {
  const id = req.query.id;
  if (!id) return res.redirect("/");

  if (req.session.uid === id) {
    return res.redirect("/welcome");
  }

  try {
    const userInfo = await Users.findById({ _id: id })
      .select("-password")
      .lean();

    const posts = await Posts.find({ uid: id })
      .populate({ path: "uid", select: "_id name profileURL" })
      .lean()
      .sort({ _id: -1 });

    res.render("userProfile", {
      posts,
      postNum: posts.length,
      userInfo,
    });
  } catch (er) {
    res.redirect("/");
  }
});

//get post route
router.get("/newpost", (req, res) => {
  res.render("newpost");
});

//post post route

router.post("/newpost", postValidation, async (req, res) => {
  const { title, contain } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render("newpost", {
      title: req.body.title,
      contain: req.body.contain.trim(),
      errorMessage: "All fields are required to fill.",
    });
  }

  if (errors.isEmpty()) {
    const html = DOMPurify.sanitize(marked.parse(contain));
    let date = new Date();
    try {
      await new Posts({
        title,
        html,
        contain,
        createdAt: `${date.getDate()}/${date.toLocaleString("default", {
          month: "short",
        })}/ ${date.getFullYear()}`,
        uid: req.session.uid,
      }).save();

      res.redirect("/welcome");
    } catch (er) {
      res.render("newPost", {
        title,
        contain,
      });
      console.log(er);
    }
  }
});

// render file upload form
router.get("/changeProfile", (req, res) => {
  res.render("uploadForm", {});
});

//logout
router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

// Deteling a post

router.post("/delete/:id", async (req, res) => {
  if (req.session.name && req.session.email) {
    const { id } = req.params;
    let success = await Posts.deleteOne({ _id: req.params.id });
    await Comment.deleteMany({ postId: id });
    if (success) {
      res.redirect("/welcome");
    } else {
      console.log("something went wrong. Try again latter.");
      res.redirect("/welcome");
    }
  } else {
    console.error("something went wrong.");
  }
});

// Edit Article

//Send edip post in edit form

router.post("/:id", async (req, res) => {
  try {
    const article = await Posts.findById(req.params.id);
    res.render("editPost", {
      id: article._id,
      title: article.title,
      contain: article.contain,
    });
  } catch (er) {
    console.log(er);
  }
});

// updating database to edit article

router.post("/editPost/:id", postValidation, async (req, res) => {
  const { title, contain } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render("newpost", {
      title: req.body.title,
      contain: req.body.contain.trim(),
      errorMessage: "All fields are required to fill.",
    });
  }
  if (errors.isEmpty()) {
    let html = DOMPurify.sanitize(marked.parse(contain));
    try {
      let success = await Posts.findByIdAndUpdate(req.params.id, {
        title,
        contain: contain.trim(),
        html,
      });
      if (success) {
        res.redirect("/welcome");
      } else {
        res.render("editPost", {
          title,
          contain: contain.trim(),
          errorMessage: "Something wrong, try again latter",
        });
      }
    } catch (err) {
      console.log(err);
      res.render("editPost", {
        title,
        contain: contain.trim(),
        errorMessage: "Something wrong, try again latter",
      });
    }
  }
});

// Upload profile picture

router.post(
  "/upload/profile",
  upload.single("userProfile"),
  async (req, res) => {
    if (!req.file) {
      return res.redirect("/changeProfile");
    } else {
      let filePath = `/images/${req.file.filename}`;

      try {
        req.session.profileURL = filePath;
        await Users.findByIdAndUpdate(req.session.uid, {
          profileURL: filePath,
        });

        res.redirect("/welcome");
      } catch (er) {
        res.redirect("/changeProfile");

        console.log(er);
      }
    }
  }
);

module.exports = router;
