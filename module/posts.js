const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
 
    uid:{
        type:mongoose.Schema.Types.ObjectId,
        require:true,
        ref:"Users"   
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
    status:{
        type: String,
        enum: ["draft", "published"],
        default: "draft",
        required:true
    },
    createdAt:{
        type:String,
        required:true
    }
})

module.exports = new mongoose.model("posts",postSchema);