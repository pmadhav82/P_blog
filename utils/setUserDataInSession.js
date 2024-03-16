
const setUserDataInSession = (req, user) =>{
const {name, profileURL, email, _id} = user
req.session.name = name;
req.session.profileURL = profileURL;
req.session.email = email;
req.session.uid = _id;

}

module.exports = setUserDataInSession;