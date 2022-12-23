const nodemailer = require("nodemailer");
require('dotenv').config();

let user = process.env.USER_MAIL;

const transport = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.USER_MAIL,
    pass: process.env.PASS_MAIL,
  },
});


exports.sendConfirmationEmail = async function (name, email, confirmationCode){
  transport.sendMail({
    from: user,
    to: email,
    subject: "Please confirm your account",
    html: `<h1>Email Confirmation</h1>
        <h2>Hello ${name}</h2>
        <p>Thank you for subscribing. Please confirm your email by clicking on the following link</p>
        <a href=${process.env.SERVER_PATHBASE}/api/v1/${confirmationCode}> Click here</a>
        </div>`,
  }).catch(err => console.log(err));
};

exports.sendForgotPasswordEmail = async function (email, confirmationCode){
  console.log(email,confirmationCode);
  transport.sendMail({
    from: user,
    to: email,
    subject: "Reset Password Link",
    html: `<p>You requested for reset password, use this link
     <a href=${process.env.FORGOTPASSWORD_PATHBASE}${confirmationCode}> Click here </a> 
     to reset your password</p>`,
  }).catch(err => console.log(err));
};