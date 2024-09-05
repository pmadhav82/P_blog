const {marked} = require("marked");
const {JSDOM} = require("jsdom");
const createDOMPurify = require("dompurify");
const {islogin} = require("../utils/loginHandeler");


const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

const previewRoute = require("express").Router();



previewRoute.post("/", islogin, (req,res)=>{
const {title,contain} = req.body;
if(!contain && !title){
  return  res.status(400).json({message:"No content found to preview"})
}

const html = DOMPurify.sanitize(marked.parse(contain));

res.status(200).json({html});

})

module.exports = previewRoute;