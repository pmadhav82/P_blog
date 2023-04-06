const express = require ("express");
const router = express.Router();
const Users = require("./module/user");
const Posts = require("./module/posts");
const Token = require("./module/token");
const bcrypt = require("bcrypt");
const  session = require("express-session");
const upload = require("./fileUpload");
const flash = require("connect-flash");
const crypto = require("crypto");
// markedjs, dompurify and jsdom init
const createDomPurify = require("dompurify");
const {JSDOM} = require("jsdom");
const {marked} = require("marked");
const window = new JSDOM('').window;
const DOMPurify = createDomPurify(window);


// User initial status
let userStatus = {
    login:false,
    name:null,
    profileURL:null,
    email:null
}


// middleware fucntion to associate connect-flash on response
router.use((req,res,next)=>{
res.locals.message = req.flash();
next()
})

//middleware function to check if the user is already loggedin or not
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
userStatus.name = req.session.name;
userStatus.profileURL = req.session.profileURL;
userStatus.email = req.session.email;
next();
    }else{
        userStatus.login = false;
        userStatus.name = null;
        userStatus.profileURL = null;
        userStatus.email=null;
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
   const {name, email,profileURL} = userStatus;   
    try{
            const posts = await Posts.find({uid:req.session.uid}).sort({"_id": -1}).lean()
      
res.render("welcome",{
  
    posts,
    userStatus,
    postNum:posts.length,
    profileURL,
    name,
    email
    
})

     }catch(err){
        console.log(err)
     }
    
  
})

// Home Route
router.get("/",  userStatusChecker,  async (req,res)=>{
    

    try{
const posts = await Posts.find().sort({"_id": -1}).lean()
res.render("home",{
   posts, 
 userStatus,
 
    
});
    }catch(err){
        console.error(err);
    
    }
})




// A user posts

router.get("/user", userStatusChecker, async(req,res)=>{
  const id = req.query.id;

  if(req.session.uid === id){
    return res.redirect("/welcome");
  }
  
  try{
  const userInfo = await Users.findById({_id:id},{"profileURL":1,"name":1, "email":1, "_id":0}).lean();
    const posts = await Posts.find({uid:id}).lean().sort({"id":-1});
const {name,profileURL,email} = userInfo
    res.render("userProfile",{
    userStatus,
    posts,
    postNum:posts.length,
    profileURL,
    name,
    email
    
})
  }catch(er){
res.redirect("/")
  }
   
})

router.get("/login", (req,res)=>{
    if(req.session.name && req.session.email){

        return res.redirect("/welcome")
    }
    res.render("login",{
        userStatus
    });
})


router.get("/signup",  (req,res)=>{
    if(req.session.name && req.session.email){

        return res.redirect("/welcome")
    }
    res.render("signup",{
        userStatus
    });
})


//password reset route
router.get("/forgot-pass",  (req,res)=>{
    if(req.session.name && req.session.email){
return res.redirect("/welcome")
    }
    
    res.render("reset",{
 userStatus  
    })
 })

// password reset post route

router.post("/passport-reset", async (req,res)=>{
    const {email} = req.body;
    
    try{
let user = await Users.findOne({email});

if(user){
    
    //check if the token is already saved or not,if saved delete the old token
let token = await Token.findOne({userId:user._id});

if(token){
    Token.deleteOne({userId:user._id});
}
const resetToken = crypto.randomBytes(32).toString('hex');
const hashedToken = await bcrypt.hash(resetToken,10);

await new Token({
    userId:user._id,
    token:hashedToken,
    createdAt:Date.now()
}).save()


const resetLink = `${req.protocol}://${req.get('host')}/password-reset-link?token=${resetToken}&id=${user._id}`;
 console.log(resetLink);


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


//password reset form route
router.get("/password-reset-link", async (req,res)=>{
if(req.session.name && req.session.email) return res.redirect("/login");

if(req.query && req.query.token && req.query.id){
const{token,id} = req.query;
try{
    const savedToken = await Token.findOne({userId:id});
    const isValid =  await bcrypt.compare(token, savedToken.token);
   
    if(isValid){
res.json({token,id})
    }else{
res.json({message:"Invalid token or link is expired"})
    }

}catch(er){
res.json({message:"something went wrong, please try again latter"})
}


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
                uid: req.session.uid,
                profileURL:req.session.profileURL
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
router.post("/signup", userStatusChecker, async (req,res)=>{
try{

    let name = req.body.name;
    let email = req.body.email;
    let password = req.body.password;
    let passwordRepeat =req.body.repeatpassword;
let foundUser = await Users.findOne({email:email});

if( !foundUser && password == passwordRepeat && password.length>=6){

let newUser = await new Users({
    name,
    email,
    password
}).save();

req.session.name = newUser.name
req.session.email = newUser.email
req.session.uid = newUser._id
req.session.profileURL = newUser.profileURL

res.redirect("/welcome")

}else {
    if(foundUser){
       req.flash("error","User is exists already");
       res.redirect("/signup")
   }

    if(password.length<6){
        req.flash("error","Password need to have minimum 6 characters")
         res.redirect("/signup")
    }
    if (password!== passwordRepeat){
        req.flash("error","Password is not match")
         res.redirect("/signup")
    }
}
}catch(err){
    console.log(err);
}

})



// render file upload form
router.get("/changeProfile", islogin, userStatusChecker, (req,res)=>{
res.render("uploadForm",{
  userStatus  
})
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
        req.session.profileURL = foundUser.profileURL
       
      res.redirect("/welcome")

    } else{
req.flash("error","Invalid email or passport")
        res.redirect("/login")
    }
    
}else{
    req.flash("error","Invalid email or passport")
        res.redirect("/login")
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






// Upload profile picture

router.post("/upload/profile",  upload.single("userProfile"), async(req,res)=>{
   
    if(!req.file){
        return res.redirect("/changeProfile")
    }
    else{   
        let success1 ;
        let success2;
        let filePath = `images/${req.file.filename}`;
        try{
           success1 = await Posts.updateMany({uid:req.session.uid},{profileURL:filePath});
           req.session.profileURL = filePath;
        }catch(er){
            console.log(er)
        }
        try{
success2 = await Users.findByIdAndUpdate(req.session.uid,{
    profileURL: filePath
})
        }catch(er){
            console.log(er)
        }
        if(success1&&success2){
           
            res.redirect("/welcome")
        } else{
            res.redirect("/changeProfile")
        }
    }
})
















module.exports = router;