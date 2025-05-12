
//middleware function to check if the user is already loggedin or not
const islogin = (req,res,next)=>{
    if(req.session.name && req.session.email){
        next()
    }else{
        res.redirect("/login")
    }

}





// 


const ifLogin = (req,res,next)=>{
    if(req.session.name && req.session.email){
        res.redirect("/welcome");
    }else{
        next();
    }

}
module.exports = {islogin,ifLogin}