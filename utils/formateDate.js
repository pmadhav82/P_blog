const moment = require("moment");

const formatDate = (date) =>{

    return moment(date).fromNow()
}

module.exports = formatDate