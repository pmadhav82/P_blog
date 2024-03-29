const signupRoute = require("express").Router();
const Users = require("../module/user");
const { ifLogin } = require("../utils/loginHandeler");
const { signupValidation } = require("../utils/userInputValidation");
const {validationResult} = require("express-validator");
const setUserDataInSession = require("../utils/setUserDataInSession");
const bcrypt = require("bcrypt"); 
signupRoute.use(ifLogin);


signupRoute.get("/",  (req,res)=>{
    res.render("signup");
})


signupRoute.post("/", signupValidation, async (req,res)=>{
    const{name, email, password, passwordRepeat} = req.body;
  const errors = validationResult(req);

  if(!errors.isEmpty()){
   const message ={error: `${errors.array()[0].msg}`}
    return res.render("signup",{
        name,
        email,
        password,
        passwordRepeat,
        message
    })
  }
    try{
    let foundUser = await Users.findOne({email});
    if(foundUser){
        req.flash("error","User exists already");
        res.redirect("/signup")
    }
  
    
    if( !foundUser && errors.isEmpty()){
        let hashedPassword = await bcrypt.hash(passwordRepeat,10);
    let newUser = await new Users({
        name,
        email,
        password:hashedPassword
    }).save();
    
    setUserDataInSession(req, newUser);
    
    res.redirect("/welcome")
    
    }
    
    
    }catch(err){
        console.log(err);
    }
    
    })

module.exports = signupRoute