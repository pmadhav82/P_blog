const mongoose = require("mongoose");



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
    authMethod:{
        type:String,
        enum:["Email/Password", "Google"],
        default:"Email/Password"
            },

    password: {
        type: String,
        required: function(){
            return this.authMethod === "Email/Password";
        },
        min: 6,
        max: 1024
    },
  
    bio:{
        type:String
    },
    linkedIn:{
        type:String
    },
    website:{
type:String
    },
    profileURL:{
        type:String,
        default:"/images/userProfile.png"
    }

},
{timestamps:true}


)




const Users =  mongoose.model("Users", userSchema);
module.exports = Users