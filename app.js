require("dotenv").config();
const express = require("express");
const handlebars = require("express-handlebars");
const PORT = process.env.PORT || 8000;
const mongoose = require("mongoose");
const commentRoute = require("./routes/commentRoute");
const app = express();
const path = require("path");
const cors = require("cors");
const session = require("express-session");
const flash = require("connect-flash");
const {userStatusChecker} = require("./utils/userStatusChecker");
const {formatDate, showBtns} = require("./utils/helperFunctions");
const {userStatus} = require("./utils/userStatusChecker");
const editProfileRoute = require("./routes/editProfileRoute");
const signupRoute = require("./routes/signupRoute");
const loginRoute = require("./routes/loginRoute");
const passwordResetRoute = require("./routes/passwordResetRoute");
const rootRoute = require("./routes/rootRoute");
const userRoute = require("./routes/userRoute");
const postRoute = require("./routes/postRoute");
const editPostRoute = require("./routes/editPostRoute");
const googleLoginRoute = require("./routes/googleLoginRoute");


app.use(express.json());

app.use(
  session({
    secret: process.env.SECRET,
    resave: true,
    saveUninitialized: true,
  
  
  })
);

app.use(flash());

// setting global variable for userStatus
app.use((req,res,next)=>{
  res.locals.userStatus = userStatus;
  next()
})


// middleware fucntion  associate connect-flash on response
app.use((req,res,next)=>{ 
  res.locals.message = req.flash();
  next()
  })
  


app.use(cors());
app.use(express.urlencoded({ extended: true }));



// userstatus checker function
app.use(userStatusChecker)



//database connection

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("connected to the database");
  })
  .catch(() => {
    console.log("Failed to connect to the database");
  });
   
//uses of public folder

app.use(express.static(path.join(__dirname, "/public")));
//app.use(express.static(path.join(__dirname,"/public")))
//app.use(express.static(path.join(__dirname,"/upload")))
app.use(express.static(`${__dirname}/upload`));

//init handlebars
app.engine("handlebars", handlebars({
  helpers:{
    formatDate,
 showBtns
  }
}));

app.set("view engine", "handlebars");
app.set("views", "./views");





//router connection
app.use("/comment", commentRoute);
app.use("/editProfile", editProfileRoute);
app.use("/forgot-pass", passwordResetRoute);
app.use("/signup", signupRoute);
app.use("/login", loginRoute);
app.use("/welcome", userRoute);
app.use("/post", postRoute);
app.use("/editPost", editPostRoute);
app.use("/googleLogin", googleLoginRoute);
app.use("/", rootRoute);

app.use("/*", (req,res)=>{
  res.render("404");
})

app.listen(PORT, () => console.log(`Server is running on ${PORT} `));
