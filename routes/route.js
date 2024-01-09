const express = require ("express");
const router = express.Router();
const Users = require("../module/user");
const Posts = require("../module/posts");
const bcrypt = require("bcrypt");
const  session = require("express-session");
const upload = require("../fileUpload");
const sendEmail = require("../utils/sendEmail");
const {generateToken, isValidToken} = require ("../utils/tokenHandeler");
const {islogin, ifLogin} = require("../utils/loginHandeler");
const flash = require("connect-flash");
const crypto = require("crypto");
// markedjs, dompurify and jsdom init
const createDomPurify = require("dompurify");
const {JSDOM} = require("jsdom");
const {marked} = require("marked");
const window = new JSDOM('').window;
const DOMPurify = createDomPurify(window);
const Comment = require("../module/comment")

//password validator
const passwordValidator = require("../utils/passWordValidator");


// userStatus
const {userStatus} = require("../utils/userStatusChecker");


// API to get blogs
router.get("/api/:email", async(req,res)=>{
    let email = req.params.email;
    
    try{
        let user = await Users.findOne({email});
    let blogs = await Posts.find({uid:user._id}).populate({path:"uid", select:"-password"}).sort({_id:-1}).lean();
    res.status(200).json(blogs)
    }catch(err){
    res.status(404).json({message:err.message})
    }
    
    })


//get routes
router.get("/welcome", islogin,  async (req,res)=>{
   const {name, email,profileURL} = userStatus;   
    try{
            const posts = await Posts.find({uid:req.session.uid}).populate("uid").sort({_id: -1}).lean()
  
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
router.get("/",   async (req,res)=>{
    
    try{
const posts = await Posts.find().sort({_id: -1}).populate("uid").lean()
res.render("home",{
   posts, 
 userStatus,
 
    
});
    }catch(err){
        console.error(err);
    
    }
})




// A user posts

router.get("/user",  async(req,res)=>{
  const id = req.query.id;

  if(req.session.uid === id){
    return res.redirect("/welcome");
  }
  
  try{
  const userInfo = await Users.findById({_id:id},{"profileURL":1,"name":1, "email":1, "_id":0}).lean();
  
const posts = await Posts.find({uid:id}).populate({path:"uid", select:"-password"}).lean().sort({_id:-1});

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

router.get("/login",ifLogin, (req,res)=>{
    res.render("login")
})


router.get("/signup", ifLogin,  (req,res)=>{
    res.render("signup");
})


//password reset route
router.get("/forgot-pass", ifLogin, (req,res)=>{
    res.render("reset")
 })

 
// password reset post route

router.post("/passport-reset", async (req,res)=>{
    const {email} = req.body;
    try{
let user = await Users.findOne({email});

if(user){
    const resetToken =  await generateToken(user._id);
    const link= `${req.protocol}://${req.get('host')}/password-reset-link?token=${resetToken}&id=${user._id}`;
 
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


//password reset form route
router.get("/password-reset-link", ifLogin, async (req,res)=>{

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


//accept new password and save it to database
router.post("/newPassword",  async(req,res)=>{
    
    if(req.query.token && req.query.id){
const {token, id}= req.query;
let isValid;
try{

    isValid = await isValidToken({token,id});
}catch(er){
    console.log(er)
}
if(isValid){

const {password, repeatPassword}=req.body;
const {isValidPassword, message} = passwordValidator(password.trim(), repeatPassword.trim())

if(!isValidPassword){
    res.render("newPasswordForm",{
        token,
            id,
         errorMessage: message
    })
}

if(isValidPassword){
try{
    let hashedPassword = await bcrypt.hash(repeatPassword,10);
    let update_success = await Users.updateOne({_id:id},{password:hashedPassword});
    if(update_success){
        req.flash("success", "password is changed successfully.")
res.redirect("/login");
    }
}catch(er){
    console.log(er)
}
}
} else{
    res.json({message:"Invalid token or link is expired"})  

}

} else{
    res.json({message:"Something went wrong! try again latter"})  
}
    })




 //get post route 
 router.get("/newpost", islogin, (req,res)=>{

        res.render("newpost",{
            userStatus
        })


 })


 //post post route

router.post("/newpost",  islogin,  async (req,res)=>{
    const {title, contain} = req.body;
    if(title.trim() === "" || contain.trim() === ""){
        res.render("newpost",{
            userStatus,
            title:req.body.title,
            contain:req.body.contain.trim(),
            errorMessage:"All fields are required to fill."
        })
    } else{
        const html = DOMPurify.sanitize(marked.parse(contain));
        let date = new Date();
        try{

              await new Posts({
                 
               
                title,
                html,
                contain,
                createdAt: `${date.getDate()}/${date.toLocaleString('default',{month:'short'})}/ ${date.getFullYear()}`,
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
router.post("/signup", async (req,res)=>{
try{
const{name, email, password, passwordRepeat} = req.body;
let foundUser = await Users.findOne({email:email});

const {isValidPassword, message} = passwordValidator(password.trim(), passwordRepeat.trim())

if(foundUser){
    req.flash("error","User is exists already");
    res.redirect("/signup")
}
if(!isValidPassword){
    req.flash("error", `${message}`)
    res.redirect("/signup")
}

if( !foundUser && isValidPassword){
    let hashedPassword = await bcrypt.hash(passwordRepeat,10);
let newUser = await new Users({
    name,
    email,
    password:hashedPassword
}).save();

req.session.name = newUser.name
req.session.email = newUser.email
req.session.uid = newUser._id
req.session.profileURL = newUser.profileURL

res.redirect("/welcome")

}


}catch(err){
    console.log(err);
}

})



// render file upload form
router.get("/changeProfile", islogin, (req,res)=>{
res.render("uploadForm",{
  userStatus  
})
})




//Login route
router.post("/login", async (req,res)=>{
try{
let foundUser = await Users.findOne({email:req.body.email})

if(foundUser){
    let submitedPass = req.body.password;
    let hashPassword = foundUser.password;
    let matchPassword ;
    try{
        matchPassword = await bcrypt.compare(submitedPass, hashPassword)
    }catch(er){
        console.log(er)
    }
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
router.get("/logout",islogin, (req,res)=>{

    req.session.destroy();
    res.redirect("/");
})


// Getting a single post
router.get("/:postId",  async(req,res)=>{
     const{postId}  = req.params;

    try{
  const  post = await Posts.findById({_id: postId}).populate({path:"uid",select:"-password"}).lean();
 
const comments = await Comment.find({postId, parentComment:null}).sort({_id:1}).populate({path:"replies"}).populate({path:"postedBy", select:"-password"}).lean();
if(post){
      res.render("singlePost",{         
  post,
  comments,
 userStatus
   })
  }

}catch(er){

    console.log(er)

}

})






// Deteling a post


router.post("/delete/:id", islogin,  async (req,res)=>{
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

router.post("/:id", islogin, async (req,res)=>{
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

router.post("/editPost/:id", islogin, async (req,res)=>{

let {title, contain}= req.body;

if(title.trim()=== "" || contain.trim()=== ""){
    res.render("editPost",{
        title,
        contain:contain.trim(),
        errorMessage:"All fields are required to field",
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
            errorMessage:"Something wrong, try again latter",
           userStatus
        })
    }

}catch(err){
    console.log(err);
    res.render("editPost",{
        title,
        contain:contain.trim(),
        errorMessage:"Something wrong, try again latter",
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
        
       
        let filePath = `/images/${req.file.filename}`;

        try{
        req.session.profileURL = filePath;
 await Users.findByIdAndUpdate(req.session.uid,{
    profileURL: filePath
})

res.redirect("/welcome")
       
}catch(er){
            res.redirect("/changeProfile")

            console.log(er)
        }
    }
})













module.exports = router;