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


//mongoose hook to hashed the password if it is new or updated
userSchema.pre("save", async function(next){
if(this.isNew || this.isModified("password")){
try{
this.password = await bcrypt.hash(this.password,10)
}catch(er){
next(er);
}
next()
}
})


module.exports = new mongoose.model("Users", userSchema);