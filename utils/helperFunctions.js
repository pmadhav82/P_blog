
const {userStatus} = require("./userStatusChecker");




const moment = require("moment");









const formatDate = (date) =>{

    return moment(date).fromNow()
}





const isCorrentUser = (userId)=>{
    const {login, uid} = userStatus
if(login && uid && uid ===userId.toString())return true
else return false
}


module.exports = {formatDate, isCorrentUser}