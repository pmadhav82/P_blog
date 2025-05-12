

const {userStatus} = require("./userStatusChecker");
const moment = require("moment");


const formatDate = (date) =>{

    return moment(date).fromNow()
}





const showBtns = (buttonType, userId) =>{
    const {uid, login} = userStatus
switch(buttonType){
   case "reply":
    return login
    case "delete":
        case "edit" :
            return login && uid == userId.toString();
        default:
        return false
}

}


const adminChecker= ()=>{

const adminEmail ="pmadhav279@gmail.com"
if(userStatus.email === adminEmail){
    return true
}

}



const isDraftPost = (status) =>{
  return status === "draft";
}


module.exports = {formatDate, showBtns, isDraftPost, adminChecker}