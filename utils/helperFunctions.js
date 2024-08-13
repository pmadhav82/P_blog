
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



const isDraftPost = (status) =>{
    if(status === "draft") return true
}


module.exports = {formatDate, showBtns, isDraftPost}