const commentRoute = require("express").Router()
const flash = require("connect-flash");
const {body, validationResult} = require("express-validator")
const {islogin} = require("../utils/loginHandeler")
const {userStatus} = require("../utils/userStatusChecker");
const Comment = require("../module/comment");






commentRoute.post("/:postId",islogin,[body("comment").trim().escape().notEmpty().withMessage("Comment field can not be empty!").isLength({min:1})], async(req,res)=>{
    const errors = validationResult(req)
    const {postId} = req.params;
    if(errors.isEmpty()){
        // save comment in database

const {comment} = req.body;

let commentObj = {
    postedBy:req.session.uid,
    postId,
    text:comment,
    
}
try{
 await new Comment(commentObj).save()
}catch(er){
    console.log(er.message)
}


    }else{
        
        req.flash("error", `${errors.array()[0].msg}`)

    }
    
    res.redirect(`/${postId}#comment-field`)
})

module.exports = commentRoute;