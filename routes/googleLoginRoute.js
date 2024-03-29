const firebase = require("firebase-admin");
const Users = require("../module/user");
const serviceAccount = require("../service-account-key.json");
const setUserDataInSession = require("../utils/setUserDataInSession");
firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
});

const googleLoginRoute = require("express").Router();

googleLoginRoute.post("/", async (req, res) => {
  const { userIdToken } = req.body;
if(!userIdToken || typeof userIdToken !== "string"){
   return  res.status(400).json({success:false, error:"Missing or Invalid token"})
}

  try {
    const {name, picture, email} = await firebase.auth().verifyIdToken(userIdToken);
    
    const foundUser = await Users.findOne({email});

    if(!foundUser){
        const newUserObj ={
            name,
            email,
            authMethod:"Google",
            password:null,
            profileURL: picture
        }
    const newUser =  await new Users(newUserObj).save();
setUserDataInSession(req, newUser);
    } 
   setUserDataInSession(req, foundUser);
    res.status(200).json({ success: true, error: null });
  } catch (er) {
    console.log(er);
    res.status(401).json({ success: false, error: "Invalid Token" });
  }
});

module.exports = googleLoginRoute;
