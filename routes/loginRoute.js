const loginRoute = require("express").Router();
const Users = require("../module/user");
const { ifLogin } = require("../utils/loginHandeler");
const { loginValidation } = require("../utils/userInputValidation");
const {validationResult} = require("express-validator");
const setUserDataInSession = require("../utils/setUserDataInSession");
const bcrypt = require("bcrypt"); 
loginRoute.use(ifLogin);


loginRoute.get("/", (req,res)=>{
    res.render("login")
})




loginRoute.post("/", loginValidation, async (req,res)=>{
const {email, password} = req.body;
const errors = validationResult(req)

if(!errors.isEmpty()){
    const message ={error: `${errors.array()[0].msg}`}
     return res.render("login",{
        
         email,
         password,
         message
     })
   }


    try{
    let foundUser = await Users.findOne({email:req.body.email})

if(! foundUser){
    req.flash("error","Invalid email or passport")
    res.redirect("/login")
}

    if(foundUser && errors.isEmpty()){
        let submitedPass = password;
        let hashPassword = foundUser.password;
        let matchPassword ;
        try{
            matchPassword = await bcrypt.compare(submitedPass, hashPassword)
        }catch(er){
            console.log(er)
        }
        if(matchPassword){
        setUserDataInSession(req, foundUser);  
    
          res.redirect("/welcome") 
    
        } else{
    req.flash("error","Invalid email or passport")
            res.redirect("/login")
        }
        
    }
    } catch(err){
        console.log(err);
    }
    
    });

module.exports = loginRoute;