



// User initial status
const userStatus = {
    login:false,
    name:null,
    profileURL:null,
    email:null,
    uid:null
}

const userStatusChecker = (req,res,next) =>{
const {name, email, profileURL, uid} = req.session;
userStatus.login = !!(name && email);
userStatus.name = userStatus.login ? name:null;
userStatus.profileURL = userStatus.login ? profileURL:null;
userStatus.email = userStatus.login?email:null
userStatus.uid = userStatus.login ? uid:null;
next()

}

module.exports = {userStatus, userStatusChecker}