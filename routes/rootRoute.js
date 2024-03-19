const Users = require("../module/user");
const Posts = require("../module/posts");
const rootRoute = require("express").Router();
const Comment = require("../module/comment");


// API to get blogs
rootRoute.get("/api/:email", async (req, res) => {
  let email = req.params.email;

  try {
    let user = await Users.findOne({ email });
    let blogs = await Posts.find({ uid: user._id })
      .populate({ path: "uid", select: "_id name profileURL" })
      .sort({ _id: -1 })
      .lean();
    res.status(200).json(blogs);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
});




// A user posts

rootRoute.get("/user", async (req, res) => {
  const {id} = req.query;

  if(req.session.uid === id){
    return res.redirect("/welcome");
  } 
  try {
    const userInfo = await Users.findById({ _id: id })
      .select("-password")
      .lean();

    const posts = await Posts.find({ uid: id })
      .populate({ path: "uid", select: "_id name profileURL" })
      .sort({ _id: -1 })
      .lean();

    res.render("userProfile", {
      posts,
      postNum: posts.length,
      userInfo,
    });
  } catch (er) {
    res.redirect("/");
  }
});


// Getting a single post
rootRoute.get("/:postId", async (req, res) => {
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



rootRoute.get("/", async (req, res) => {
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

module.exports = rootRoute;
