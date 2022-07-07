const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
    creator:{
        type: String,
        required:true
    },
    uid:{
        type: String,
        required:true
    },
    title:{
        type: String,
        required:true
    },
    html:{
        type: String,
        required:true
    },
    contain:{
        type: String,
        required:true
    },
    createdAt:{
        type:String,
        
        required:true
    }



})

module.exports = new mongoose.model("posts",postSchema);