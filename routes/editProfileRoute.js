const { islogin } = require("../utils/loginHandeler");

const editProfileRoute = require("express").Router();


editProfileRoute.get("/", islogin, async(req,res)=>{

    res.render("editProfile");
})


module.exports = editProfileRoute;