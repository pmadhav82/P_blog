const commentRoute = require("express").Router()
const flash = require("connect-flash");
const {body, validationResult} = require("express-validator")
const {islogin} = require("../utils/loginHandeler")
const Comment = require("../module/comment");






commentRoute.post("/:postId",islogin,[body("comment").trim().escape().notEmpty().withMessage("Comment field can not be empty!")], async(req,res)=>{
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




commentRoute.post("/:commentId/reply/:postId", islogin,[body("replyText").trim().escape().notEmpty()], async(req,res)=>{
const commentId = req.params.commentId;
const postId = req.params.postId;
    const errors = validationResult(req)
const {replyText} = req.body;
if(errors.isEmpty()){
    const replyObj = {
        postedBy:req.session.uid,
        postId,
        text:replyText,
        parentComment:commentId
    }
    try{
        
        const newReply = await new Comment(replyObj).save()
        await Comment.findOneAndUpdate({_id:commentId, postId},{$push:{replies:newReply._id}})
    } catch(er){
console.log(er.message)
req.flash("error", `Failed to post a reply`)
    }
  
}

res.redirect(`/${postId}#${commentId}`)

})




commentRoute.post("/:commentId/delete/:postId", islogin, async(req,res)=>{
const commentId = req.params.commentId;
const postId = req.params.postId;
try{
    const comment = await Comment.findOne({_id:commentId, postId}).lean()
    console.log(comment.postedBy.toString())
    if(comment && comment.postedBy.toString() === req.session.uid){
        await Comment.deleteMany({_id:{$in:comment.replies}})
        const deleted = await Comment.deleteOne({_id:commentId})
        if(deleted){
            
res.redirect(`/${postId}#comment-field`)
        }
    }else{
              
        req.flash("error", `Comment failed to delete`)

        res.redirect(`/${postId}#comment-field`)
    }

}catch(er){
    console.log(er.message)
}



})

module.exports = commentRoute;