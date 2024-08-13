const Posts = require("../module/posts");
const { islogin } = require("../utils/loginHandeler");
const { postValidation } = require("../utils/userInputValidation");
const { validationResult } = require("express-validator");
const editPostRoute = require("express").Router();
const createDomPurify = require("dompurify");
const { JSDOM } = require("jsdom");
const { marked } = require("marked");
const window = new JSDOM("").window;
const DOMPurify = createDomPurify(window);
editPostRoute.use(islogin);

editPostRoute.post("/", async (req, res) => {
  const { postId } = req.query;
  try {
    const article = await Posts.findById(postId)
      .select("contain _id title status")
      .lean();
    if (!article) return res.redirect("/welcome");
  
    res.render("editPost", {
      id: article._id,
      title: article.title,
      contain: article.contain,
      status: article.status
    });
  } catch (er) {
    res.json({ message: er.message });
  }
});

// updating database to edit article

editPostRoute.post("/:id", postValidation, async (req, res) => {
  const { title, contain, action } = req.body;
  const { id } = req.params;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render("newpost", {
      title,
      contain,
      errorMessage: errors.array()[0].msg,
    });
  }
  if (errors.isEmpty()) {
    let html = DOMPurify.sanitize(marked.parse(contain));
    try {
      await Posts.findByIdAndUpdate(id, {
        title,
        contain: contain.trim(),
        status: action,
        html,
      });

      res.redirect(`/${id}`);
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

module.exports = editPostRoute;
