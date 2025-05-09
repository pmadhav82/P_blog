const adminRoute = require("express").Router();
const Users = require("../module/user");
const client = require("../utils/s3Client");
const { ListObjectsV2Command, DeleteObjectCommand } = require("@aws-sdk/client-s3");

const BUCKET_NAME = "pblog-images-bucket";

adminRoute.get("/", async (req, res) => {
  const users = await Users.find().select("-password").lean();

  res.render("admin", { users });
});

adminRoute.get("/media", async (req, res) => {
  const command = new ListObjectsV2Command({ Bucket: BUCKET_NAME });
  try {
    const response = await client.send(command);
    const imageKey = response.Contents?.map(
      (obj) => obj.Key
    );


    res.render("media", {
      imageKey
    });
  } catch (error) {
    console.log(error.message);
    res.redirect("/admin");
  }
});




adminRoute.post("/media/:imageKey", async(req,res)=>{

const {imageKey} = req.params;

const command = new DeleteObjectCommand({Bucket:BUCKET_NAME, Key:imageKey});

try{
await client.send(command);

}catch(error){
    console.log(error.message);
    res.redirect("/admin/media")
}

    res.redirect("/admin/media")
})


module.exports = adminRoute;
