
const passwordValidator = (password, repeatPassword) =>{
    if(password === repeatPassword){
       
        if(password.length >6){
            return{
                isValidPassword:true,
                message:"Password is verified"
            }

        }else{
            return{
                isValidPassword:false,
                message:"Password need to have minimum 6 characters"
            }
        }
    }else{
       return {
            isValidPassword:false,
            message:" Password is not match"
        }
    }
    }

    module.exports = passwordValidator;
