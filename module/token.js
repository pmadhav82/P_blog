const mongoose = require("mongoose");
const{Schema, model}= mongoose;

const tokenSchema= new Schema({
    userId:{
        type:Schema.Types.ObjectId,
        require:true,
        ref:"Users"   
    },
    token:{
        type:String,
        require:true
    },
    createdAt:{
        type:Date,
        default:Date.now,
        expires:3600
    }
})

module.exports = new model("token",tokenSchema);