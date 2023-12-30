const mongoose = require("mongoose");
const bcrypt = require("bcrypt");


const userSchema = new mongoose.Schema({

    email: {
        type: String,
        unique: true,
        lowercase: true,
        required: true
    },
    name: {
        type: String,
        required:true
    },
    password: {
        type: String,
        required: true,
        min: 6,
        max: 1024
    },
    profileURL:{
        type:String,
        default:"images/userProfile.png"
    }

})




const Users =  mongoose.model("Users", userSchema);
module.exports = Users