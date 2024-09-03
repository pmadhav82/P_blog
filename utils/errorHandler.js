const errorHandler = (error, req,res,next) =>{

const errorStatusCode = res.statusCode || 500;
let errorMessage = error.message || "Something went wrong!";
res.status(errorStatusCode).json({message: errorMessage, success: false});


}

module.exports = errorHandler