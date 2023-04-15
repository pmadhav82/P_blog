const nodemailer = require("nodemailer");

const sendEmail = (payload)=>{
const { email, subject, html}= payload

const transporter = nodemailer.createTransport({
    host:process.env.EMAIL_HOST,
    secure:true,
    port:465,
    auth:{
        user:process.env.EMAIL_USERNAME,
        pass:process.env.EMAIL_PASSWORD
    }
})

const mailOptions ={
from:"p.blog@pblog.online",
to:email,
subject:subject,
html:  html
}

transporter.sendMail(mailOptions,(error,info)=>{
    if(error){
        console.log(error)
    }else{
console.log(info);
    }
    
})

}

module.exports = sendEmail;