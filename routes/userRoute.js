
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
      .populate({path:"uid", select: "_id name profileURL"})
      .sort({ _id: -1 })
      .select("_id title createdAt html status")     
      .lean();
      
    const user = await Users.findById(userId).select("-password").lean();
    res.render("welcome", {
      user,
      posts,
      postNum: posts.length,
    });
  } catch (err) {
    res.json({message:"Something went wrong."})
    console.log(err);
  }
});
//logout
userRoute.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/");
  });
  

module.exports = userRoute;