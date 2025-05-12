

const adminEmail ="pmadhav279@gmail.com";




const isAdmin = (req, res, next) => {
    if (req.session.email === adminEmail) {
        next();
    } else {
        res.redirect("/");
    }
}


module.exports = isAdmin; 