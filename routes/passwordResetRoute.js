const { validationResult } = require("express-validator");
const Users = require("../module/user");
const { ifLogin } = require("../utils/loginHandeler");
const sendEmail = require("../utils/sendEmail");
const passwordResetRoute = require("express").Router();
const {generateToken, isValidToken} = require("../utils/tokenHandeler");
const { passwordValidation } = require("../utils/userInputValidation");
const bcrypt = require("bcrypt");


passwordResetRoute.use(ifLogin);


passwordResetRoute.get("/",(req,res)=>{
    res.render("reset")
})




passwordResetRoute.post("/", async(req,res)=>{

    const {email} = req.body;
    if(!email)return res.redirect("/login");

    try{
let user = await Users.findOne({email});

if(user){
    const resetToken =  await generateToken(user._id);
    const link= `${req.protocol}://${req.get('host')}/forgot-pass/password-reset-link?token=${resetToken}&id=${user._id}`;
 
// html for email
const html = `<b> Hi ${user.name}, </b>
<p> You requested to reset your password. </p>
<p> Please, click the link below to reset your password. </p>
<a href = "${link}"> Reset Password </a>
`


const payload = {
    email,
    subject:"Password reset request",
    html
}
console.log(payload);
sendEmail(payload);


req.flash("success", "Check your email for the password reset link")
    res.redirect("/login")
}else{
    req.flash("error","We could not find any user, please check your email address again")
res.redirect("/forgot-pass")
}
    }catch(er){
        console.log(er);
        req.flash("error","Something went wrong, please try again later!")
        res.redirect("/forgot-pass")
    }



})



passwordResetRoute.get("/password-reset-link", async(req,res)=>{


    if(req.query && req.query.token && req.query.id){
        //check token and id are valid
    const{token,id} = req.query;

    
    try{
       const isValid = await isValidToken({token,id});
        if(isValid){
    res.render("newPasswordForm",{
        token,
        id,
    
    })
        }else{
    res.json({message:"Invalid token or link is expired"})
        }
    
    }catch(er){
        console.log(er)
    res.json({message:"something went wrong, please try again latter"})
    }
    
    
    }else{
        res.redirect("/login")
    }
})



passwordResetRoute.post("/password-reset-link", passwordValidation, async(req,res)=>{
    const {password, passwordRepeat}=req.body;
    const {token, id}= req.query;
    
const errors = validationResult(req);

if(!errors.isEmpty() || !token || !id){
    const message ={error: `${errors.array()[0].msg}`}
   return  res.render("newPasswordForm",{
token,
id,
     message
    })
}

    if(token && id){
       
        let isValid;
        try{
        
            isValid = await isValidToken({token,id});
        }catch(er){
            console.log(er)
        }
        if(isValid && errors.isEmpty()){
        
        try{
            let hashedPassword = await bcrypt.hash(password,10);
            let update_success = await Users.updateOne({_id:id},{password:hashedPassword});
            if(update_success){
                req.flash("success", "password is changed successfully.")
        res.redirect("/login");
            }
        }catch(er){
            console.log(er)
        }
        
        } else{
            res.json({message:"Invalid token or link is expired"})  
        
        }
        
        } else{
            res.json({message:"Something went wrong! try again latter"})  
        }
})

module.exports = passwordResetRoute;