const express = require ("express");
const router = express.Router();
const Users = require("./module/user");
const Posts = require("./module/posts");
const bcrypt = require("bcrypt");
const  session = require("express-session");


// markedjs, dompurify and jsdom init

const createDomPurify = require("dompurify");
const {JSDOM} = require("jsdom");
const {marked} = require("marked");
const mongodb = require("mongodb");
const mongoose = require("mongoose");



const window = new JSDOM('').window;
const DOMPurify = createDomPurify(window);




let errorMessages ={};



 
router.use(session({secret: process.env.SECRET
, resave:true,saveUninitialized:true}))



// User initial status
let userStatus = {
    login:false,
    name:null
}



//middleware function to check user is already loggedin or not
const islogin = (req,res,next)=>{
    if(req.session.name && req.session.email){
        next()
    }else{
        res.redirect("/login")
    }

}

//middleware function to check status
const  userStatusChecker = (req,res,next)=>{
    if(req.session.name &&  req.session.email){
userStatus.login = true;
userStatus.name = req.session.name
next();
    }else{
        userStatus.login = false;
        userStatus.name = null;
     next();
    }
}

// API to get blogs
router.get("/api/madhavblogs", async(req,res)=>{
    let uid = "62cd89d53e61de6c5bfbfe02"
    try{
    let blogs = await Posts.find({uid}).sort({_id:-1});
    res.status(200).json(blogs)
    }catch(err){
    res.status(404).json({message:"Something went wrong"})
    }
    
    })


//get routes
router.get("/welcome", islogin, userStatusChecker, async (req,res)=>{
        try{
            const posts = await Posts.find({uid:req.session.uid}).sort({"_id": -1}).lean()
      
res.render("welcome",{
    name:userStatus.name,
    email:req.session.email,
    posts,
    userStatus
   
})
     }catch(err){
        console.log(err)
     }
    
  
})

// Home Route
router.get("/",  userStatusChecker,  async (req,res)=>{
    console.log(userStatus);

    try{
const posts = await Posts.find().sort({"_id": -1}).lean()

res.render("home",{
   posts, 
 userStatus
    
});
    }catch(err){
        console.error(err);
    }
})

router.get("/login", (req,res)=>{
    if(req.session.name && req.session.email){

        return res.redirect("/welcome")
    }
    res.render("login");
})
router.get("/singup",  (req,res)=>{
    if(req.session.name && req.session.email){

        return res.redirect("/welcome")
    }
    res.render("singup");
})


//password reset route
router.get("/reset",  (req,res)=>{
    if(req.session.name && req.session.email){

        res.render("reset",{
            login:true
        });
    }else{
        res.redirect("/login")
    }
 })



 //get post route 
 router.get("/newpost", islogin, userStatusChecker, (req,res)=>{

        res.render("newpost",{
            userStatus
        })


 })


 //post post route

router.post("/newpost",  islogin, userStatusChecker, async (req,res)=>{
    const {title, contain} = req.body;
    if(title.trim() === "" || contain.trim() === ""){
        res.render("newpost",{
            userStatus,
            title:req.body.title,
            contain:req.body.contain.trim(),
            message:"All fields are required to fill."
        })
    } else{
        const html = DOMPurify.sanitize(marked.parse(contain));
        let date = new Date();
        try{

              await new Posts({
            
                creator:req.session.name,
                title,
                html,
                contain,
                createdAt: `${date.getDate()}/${date.getMonth()+1}/ ${date.getFullYear()}`,
                uid: req.session.uid
            
            }).save();

            res.redirect("/welcome")
        }
            catch(er){
                res.render("newPost",{
                    userStatus,
                    title,
                    contain
                })
                console.log(er)
            } 
    }
})



//Singup route
router.post("/singup", userStatusChecker, async (req,res)=>{
try{

    let name = req.body.name;
    let email = req.body.email;
    let password = req.body.password;
    let passwordRepeat =req.body.repeatpassword;
let foundUser = await Users.findOne({email:email});

if( !foundUser && password == passwordRepeat && password.length>=6){
    let hashPassword = await bcrypt.hash(password, 10);
let newUser = await new Users({
    name:name,
    email:email,
    password:hashPassword
}).save();

req.session.name = newUser.name
req.session.email = newUser.email
req.session.uid = newUser._id

res.redirect("/welcome")

}else{
    if(password.length<6){
        errorMessages.passLength = "Password need to have minimum 6 characters"
    }if (password!== passwordRepeat){
        errorMessages.passMatch = "Password is not match";
    }
    if (foundUser){
        errorMessages.userExists = "User is exists already"
    }



    res.render("singup",{
        userExists:errorMessages.userExists,
        passLength:errorMessages.passLength,
        passMatch:errorMessages.passMatch,
        name,
        email,
        userStatus
        
    })
}
}catch(err){
    console.log(err);
}

})

//Login route
router.post("/login", userStatusChecker, async (req,res)=>{
try{
let foundUser = await Users.findOne({email:req.body.email})

if(foundUser){
    let submitedPass = req.body.password;
    let hashPassword = foundUser.password;
    let matchPassword =  await bcrypt.compare(submitedPass, hashPassword)
    if(matchPassword){
        req.session.name = foundUser.name;
        req.session.email = foundUser.email
        req.session.uid = foundUser._id
       
      res.redirect("/welcome")

    } else{

        res.render("login",{
            message:"Invalid email or passport",
            email:req.body.email,
            userStatus
    
        })
    }
    
}else{
    res.render("login",{
        message:"Invalid email or passport",
        email:req.body.email,
        userStatus
    })
}

} catch(err){
    console.log(err);
}


})


//logout
router.get("/logout",islogin, userStatusChecker,(req,res)=>{

    req.session.destroy();
    res.redirect("/");
})


//Delete Account
router.post("/deleteAccount", async (req,res)=>{
    try{
      let success = await Users.deleteOne({email: req.session.email});
      if(success){
       req.session.destroy()
res.redirect("/")
      }else{
        res.status(500).send("Something wrong, try again ...")
      }
    }catch(err){
        res.status(500).send("Something wrong, try again ...")
    }
  
})

//reset password
router.post("/reset", async (req,res)=>{
    
    let name = req.body.name;
    let email = req.body.email;
    let password = req.body.password;
    let passwordRepeat =req.body.repeatpassword;
try{
    
    if(name.toUpperCase().trim() == req.session.name.toUpperCase().trim() && email == req.session.email && password == passwordRepeat && password.length>=6){
let hashPassword = await bcrypt.hash(password, 10);
let success = await Users.updateOne({email:email},{password:hashPassword})
if(success){
    
res.redirect("/welcome")
}else{
    res.status(500).send("Something wrong, try again ...")
}
    }else{

        if(password.length<6){
            errorMessages.passLength = "Password need to have minimum 6 characters"
        }if (password!== passwordRepeat){
            errorMessages.passMatch = "Password is not match";
        }
        if(name.toUpperCase().trim() !== req.session.name.toUpperCase().trim() || email !== req.session.email){
            errorMessages.notMatch = "Your credential is not matched"
        }
        res.render("reset",{
            
            passLength:errorMessages.passLength,
            passMatch:errorMessages.passMatch,
            notMatch:errorMessages.notMatch,
            userStatus
            
        })
    }

}catch(err){
    console.log(err);
}


})






// Getting a single post
router.get("/:id", userStatusChecker, async(req,res)=>{
     const{id}  = req.params;
let post;
    try{
    post = await Posts.findById({_id: id}).lean();

}catch(er){

    console.log(er)

}
if(post){
    res.render("singlePost",{         
post,
       userStatus
 })
}

})



// Deteling a post


router.post("/delete/:id", islogin, userStatusChecker, async (req,res)=>{
 if(req.session.name && req.session.email){
let success =  await Posts.deleteOne({_id:req.params.id});
if(success){
  
    res.redirect("/welcome");
}else{
    console.log("something went wrong. Try again latter.");
    res.redirect("/welcome");
}


 }else{
    console.error("something went wrong.")
 }
})




// Edit Article

//Send edip post in edit form

router.post("/:id", islogin,userStatusChecker, async (req,res)=>{
    try{
        const article = await Posts.findById(req.params.id);
        res.render("editPost",{
            id:article._id,
            title:article.title,
            contain:article.contain,
            userStatus
        })


    }catch(er){
        console.log(er);
    }

})

// updating database to edit article

router.post("/editPost/:id", islogin, userStatusChecker, async (req,res)=>{

let {title, contain}= req.body;

if(title.trim()=== "" || contain.trim()=== ""){
    res.render("editPost",{
        title,
        contain:contain.trim(),
        message:"All fields are required to field",
        userStatus
    })
}else{
let html = DOMPurify.sanitize(marked.parse(contain));
try{
    let success = await Posts.findByIdAndUpdate(req.params.id,{
        title,
        contain:contain.trim(),
        html
    });
    if(success){
        res.redirect("/welcome")
    }else{
        res.render("editPost",{
            title,
            contain:contain.trim(),
            message:"Something wrong, try again latter",
           userStatus
        })
    }

}catch(err){
    console.log(err);
    res.render("editPost",{
        title,
        contain:contain.trim(),
        message:"Something wrong, try again latter",
        userStatus
    })
}
}
})


module.exports = router;