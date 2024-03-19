
const { islogin } = require("../utils/loginHandeler");
const Users = require("../module/user");
const Posts = require("../module/posts");
const userRoute = require("express").Router();

userRoute.use(islogin);

//get routes
userRoute.get("/", async (req, res) => {

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
//logout
userRoute.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/");
  });
  

module.exports = userRoute;