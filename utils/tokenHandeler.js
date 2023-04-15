const User = require("../module/user");
const Token = require("../module/token");
const bcrypt = require("bcrypt");
const crypto = require("crypto");


const generateToken = async(id)=>{
let token = await Token.findOne({userId:id});
if(token){
    await Token.deleteOne({userId:id});
}

// generate token
const resetToken = crypto.randomBytes(32).toString("hex");

//hash reset token
const hashedToken =  await bcrypt.hash(resetToken,10)

// save token in database

await new Token({
    userId:id,
    token:hashedToken,
    createdAt:Date.now()
}).save()

return resetToken;

}



const isValidToken = async({token,id})=>{
const savedToken = await Token.findOne({userId:id}).lean();
//compare the token
const isValidToken = await bcrypt.compare(token,savedToken.token);
return isValidToken;

}



module.exports = {
    generateToken,
    isValidToken
}
