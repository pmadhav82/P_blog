const { check } = require("express-validator");

const passwordValidation = [
  check("password")
    .isLength({ min: 6 })
    .withMessage("Password need to have minimum 6 characters"),
  check("passwordRepeat")
    .custom((value, { req }) => value === req.body.password)
    .withMessage("Passwords do not match"),
];

const userInfoValidation = [
  check("name").notEmpty().withMessage("Name is required"),
  check("email").isEmail().withMessage("Enter a valid email"),
];

const signupValidation = [...userInfoValidation, ...passwordValidation];

const loginValidation = [
  check("email").isEmail().withMessage("Enter email id"),
  check("password").notEmpty().withMessage("Enter password"),
];

const postValidation = [
  check("title").notEmpty().withMessage("All fields are required to fill"),
  check("contain").notEmpty().withMessage("All fields are required to fill"),
];
module.exports = {
  signupValidation,
  loginValidation,
  passwordValidation,
  postValidation,
  userInfoValidation
};
