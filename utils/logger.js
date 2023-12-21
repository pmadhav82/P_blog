const fs = require("fs");
const fsPromises = require("fs").promises;
const path = require("path");


const logEvents = async (message, logFileName) => {

try{
if(!fs.existsSync(path.join(__dirname, "..", "logs"))){
    await fsPromises.mkdir(path.join(__dirname, "..", "logs"))
}
await fsPromises.appendFile(path.join(__dirname, "..", "logs", logFileName),message)
}catch(er){
    console.log(er)
}

}

module.exports = {logEvents}