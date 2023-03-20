require("dotenv").config();
const express = require("express");
const handlebars = require("express-handlebars");
const PORT = process.env.PORT || 8000;
const mongoose = require("mongoose");
const route = require("./route");
const app = express();
const path = require("path");
const cors = require("cors");
const session = require("express-session");
const flash = require("connect-flash");

app.use(
  session({
    secret: process.env.SECRET,
    resave: true,
    saveUninitialized: true,
  })
);

app.use(flash());

app.use(cors());
app.use(express.urlencoded({ extended: true }));

//database connection

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("connected to the database");
  })
  .catch(() => {
    console.log("Failed to connect to the database");
  });
let db = mongoose.connection;

// db.once("open",()=>{
//     console.log("connect successfully..");
// })
// db.on("error",()=>{
//     console.log("error occured..")
// })

//uses of public folder

app.use(express.static(path.join(__dirname, "/public")));
//app.use(express.static(path.join(__dirname,"/public")))
//app.use(express.static(path.join(__dirname,"/upload")))
app.use(express.static(`${__dirname}/upload`));

//init handlebars
app.engine("handlebars", handlebars());

app.set("view engine", "handlebars");
app.set("views", "./views");

//router connection
app.use("/", route);

app.listen(PORT, () => console.log(`Server is running on ${PORT}`));
