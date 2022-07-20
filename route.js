const express = require ("express");
const router = express.Router();
const Users = require("./module/user");
const Posts = require("./module/posts");
const bcrypt = require("bcrypt");
const  session = require("express-session");

// markedjs, dompurify and jsdom init

const createDomPurify = require("dompurify");
const {JSDOM} = require("jsdom");
const {marked} = require("marked")

const window = new JSDOM('').window;
const DOMPurify = createDomPurify(window);




let errorMessages ={};



 
router.use(session({secret: process.env.SECRET
, resave:true,saveUninitialized:true}))







//middleware function to check user is already login or not
let islogin = (req,res,next)=>{
    if(req.session.name){
        res.redirect("/welcome")
    }else{
        next()
    }

}


//get routes
router.get("/welcome",  async (req,res)=>{
    if(req.session.name && req.session.email){
        try{
            const userPosts = await Posts.find({uid:req.session.uid}).sort({"title": -1}).lean()
      
res.render("welcome",{
    name:req.session.name,
    email:req.session.email,
    userPosts,
    login:true
   
})
     }catch(err){
        console.log(err)
     }
    
    }
    else{
        res.redirect("login");
    }
})

// Home Route
router.get("/",   async (req,res)=>{
    let login = req.session.name? true:false;
    try{
const posts = await Posts.find().sort({"_id": -1}).lean()

res.render("home",{
   posts, 
   login
    
});
    }catch(err){
        console.error(err);
    }
})

router.get("/login" , islogin, (req,res)=>{
    res.render("login");
})
router.get("/singup", islogin, (req,res)=>{
    res.render("singup");
})
router.get("/reset", islogin, (req,res)=>{
     res.render("reset");
 })



 //get post route 
 router.get("/newpost", (req,res)=>{
    if(req.session.name && req.session.email){

        res.render("newpost")
    } else
{
    res.redirect("/login")
}
 })


 //post post route

router.post("/newpost",  async (req,res)=>{
    
if(req.session.name && req.session.email){


    const {title, contain} = req.body;
    if(title.trim() === "" || contain.trim() === ""){
        res.render("newpost",{
            title:req.body.title,
            contain:req.body.contain.trim(),
            message:"All fields are required to fill."
        })
    } else{
        const html = DOMPurify.sanitize(marked.parse(contain));
        try{

              await new Posts({
            
                creator:req.session.name,
                title,
                html,
                contain,
                createdAt: new  Date().toLocaleDateString(),
                uid: req.session.uid
            
            }).save();

            res.redirect("/")
        }
            catch(er){
                res.render("newPost",{
                    title,
                    contain
                })
                console.log(er)
            }  
           

    }
}else{
    res.redirect("/login")
}
        

})



//Singup route
router.post("/singup",  async (req,res)=>{
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
res.redirect("welcome")

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
        name:name,
        email:email,
        
    })
}
}catch(err){
    console.log(err);
}

})

//Login route
router.post("/login", async (req,res)=>{
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
       
      res.redirect("welcome")

    } else{

        res.render("login",{
            message:"Invalid email or passport",
            email:req.body.email
    
        })
    }
    
}else{
    res.render("login",{
        message:"Invalid email or passport",
        email:req.body.email

    })
}

} catch(err){
    console.log(err);
}


})


//logout
router.get("/logout",(req,res)=>{

    req.session.destroy();
    res.redirect("/");
})


//Delete Account
router.get("/deleteAccount", async (req,res)=>{
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
    let user = await Users.findOne({email:email})
    if(user.name == name && user.email == email && password == passwordRepeat && password.length>=6){
let hashPassword = await bcrypt.hash(password, 10);
let success = await Users.updateOne({email:email},{password:hashPassword})
if(success){
    req.flash('message', "Password reset successfully")
res.redirect("/")
}else{
    res.status(500).send("Something wrong, try again ...")
}
    }else{

        if(password.length<6){
            errorMessages.passLength = "Password need to have minimum 6 characters"
        }if (password!== passwordRepeat){
            errorMessages.passMatch = "Password is not match";
        }
        if(user.name !== name || user.email !== email){
            errorMessages.notMatch = "Your credential is not matched"
        }
        res.render("reset",{
            
            passLength:errorMessages.passLength,
            passMatch:errorMessages.passMatch,
            notMatch:errorMessages.notMatch
            
        })
    }

}catch(err){
    console.log("err");
}


})






// Getting a single post
router.post("/post/:id", async(req,res)=>{
    
    const{id}  = req.params;

    let login = req.session.name? true:false;

    try{
    
    const post = await Posts.findOne({_id:id}).lean();

        res.render("singlePost",{         
       post,
            login
           })



    }catch(er){

        console.log(er)

    }
  
})



// Deteling a post


router.post("/delete/:id", async (req,res)=>{
 if(req.session.name && req.session.email){
let success =  await Posts.deleteOne({_id:req.params.id});
if(success){
  
    res.redirect("/welcome");
}else{
    console.log("something went wrong. Try again latter.");
    res.render("welcome")
}


 }else{
    console.error("something went wrong.")
 }
})




// Edit Article

//Send edip post in edit form

router.post("/edit/:id", async (req,res)=>{
if( req.session.name && req.session.email){
    try{
        const article = await Posts.findById(req.params.id);
        res.render("editPost",{
            id:article._id,
            title:article.title,
            contain:article.contain
        })


    }catch(er){
        console.log(er);
    }


}else{
    res.redirect("/login");
}

})

// updating database to edit article

router.post("/editPost/:id", async (req,res)=>{
if(req.session.name && req.session.email){
let {title, contain}= req.body;

if(title.trim()=== "" || contain.trim()=== ""){
    res.render("editPost",{
        title,
        contain:contain.trim(),
        message:"All fields are required to field"
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
            message:"Something wrong, try again latter"
        })
    }

}catch(err){
    console.log(err);
    res.render("editPost",{
        title,
        contain:contain.trim(),
        message:"Something wrong, try again latter"
    })
}

}




}else{
    res.redirect("/login");
}

})


module.exports = router;