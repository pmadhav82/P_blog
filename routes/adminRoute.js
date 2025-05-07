const adminRoute = require("express").Router();
const Users = require("../module/user");
const client = require("../utils/s3Client");
const {ListObjectsV2Command} = require("@aws-sdk/client-s3");

adminRoute.get("/", async (req,res)=>{

const users = await Users.find().select("-password").lean();


    res.render("admin",{users})
})


adminRoute.get("/media", async(req,res)=>{
const command = new ListObjectsV2Command({Bucket: "pblog-images-bucket"});
try{
const response = await client.send(command);
const imageURL = response.Contents?.map(obj=>`https://pblog-images-bucket.s3.ap-southeast-2.amazonaws.com/${obj.Key}`);

console.log(imageURL);
res.render("media",{
    imageURL
})
}catch(error){
    console.log(error.message);
    res.redirect("/admin");
}


   
})



module.exports = adminRoute;