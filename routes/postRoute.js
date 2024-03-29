const Comment = require("../module/comment");
const Posts = require("../module/posts");
const { islogin } = require("../utils/loginHandeler");
const { postValidation } = require("../utils/userInputValidation");
const { validationResult } = require("express-validator");
const postRoute = require("express").Router();
const createDomPurify = require("dompurify");
const { JSDOM } = require("jsdom");
const { marked } = require("marked");
const window = new JSDOM("").window;
const DOMPurify = createDomPurify(window);





postRoute.use(islogin);

postRoute.get("/", (req,res)=>{

    res.render("newpost");
})


postRoute.post("/", postValidation, async (req, res) => {
    const { title, contain } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render("newpost", {
        title: req.body.title,
        contain: req.body.contain.trim(),
        errorMessage: errors.array()[0].msg
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


//
// Deteling a post

postRoute.post("/delete/:id", async (req, res) => {
    
      const { id } = req.params;
      let success = await Posts.deleteOne({ _id: id });
      await Comment.deleteMany({ postId: id });
      if (success) {
        res.redirect("/welcome");
      } else {
        console.log("something went wrong. Try again latter.");
        res.redirect("/welcome");
      }

  });
  

  module.exports = postRoute;