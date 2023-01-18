const { promisify } = require('util');
const controldata = require('../lib/controldata.lib');
const bcrypt = require('bcrypt');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const jwt = require('jsonwebtoken');
const nodemailer = require("./authMail.service");
const jwtExpirySeconds = process.env.EXPIRYSECONDS;
const codArea = '549'; //Argentine area code
var formidable = require('formidable');
var fs = require('fs');
require('dotenv').config();

// Generates hash using bCrypt
var createHash = async function(password){
    return bcrypt.hashSync(password, bcrypt.genSaltSync(10), null);
}
  
// Validated password
var validatePassword = function(user, password){   
    return bcrypt.compareSync(password, user.password);   
}

var fileupload = function(files){
        var newpath = '';
          var oldpath = files.img.filepath;
          newpath = `${process.env.FILE_FOLDER_PATH}image-${Date.now().toString()}.${files.img.mimetype.split('/')[1]}`;
          fs.rename(oldpath, newpath, function (err) {
            if (err) throw err;
          });
        return newpath;
}

exports.singUp = async function (req, res, repository, user){
    try{
        let userRepository = repository;
        let error = await checkUserData(req);
    
        if(typeof error != "undefined"){
            res.status(400).json(error).end();
            return;
        }

        let finduser = await userRepository.findOne({where : { mail: req.body.mail }}); 

        if (typeof finduser != "undefined"){
         res.status(400).json({"message" : "The email is already registered."}).end();
         return;
        }
        
            const newUser = user;
            newUser.mail = req.body.mail;
            newUser.userName = req.body.username;
            newUser.password = await createHash(req.body.password);
            newUser.mobilePhone = req.body.mobilephone != undefined? codArea + req.body.mobilephone : '';
            newUser.creationDate = new Date();
            newUser.confirmationCode = jwt.sign({email: req.body.mail}, process.env.JWTKEY)
            await userRepository.save(newUser);            

            await nodemailer.sendConfirmationEmail(
                newUser.userName,
                newUser.mail,
                newUser.confirmationCode
             );

            res.status(201).end(JSON.stringify({
               message:
                 "User was registered successfully! Please check your email",
            }))

    }catch(err){
        res.status(500).send({ message: err });
        console.log(err);
    }    
}

// Check UserData
async function checkUserData (req){
    var error = undefined;        

    if(typeof error == "undefined")
      error = typeof req.body.password != "undefined" ? 
      await controldata.checkPassword(req.body.password) : {"message" : "You must enter a password."};

    if(typeof error == "undefined")
      error = typeof req.body.mail != "undefined" ? 
      await controldata.checkMail(req.body.mail) : {"message" : "You must enter an email."};
    
    if(typeof error == "undefined")
      error = typeof req.body.mobilephone != "undefined" ? 
      await controldata.checkMobilePhone(codArea + req.body.mobilephone) : undefined;

    return error;
}

exports.singIn = async function (req, res, repository, wsession){
    await passport.use(new LocalStrategy(
        {
            usernameField: 'mail',
            passwordField: 'password',
            session: false
        }, 
    function (mail, password, done) {
        let userRepository = repository;
        let minutos = 600000;
        //this one is typically a DB call. Assume that the returned user object is pre-formatted and ready for storing in JWT
        userRepository.findOne({where : {mail: mail}})
           .then(user => {
               if (!user || !validatePassword(user,password)) {
                   return done(null, false, {message: 'Incorrect email or password.'});
               }
               if(!user.verifiedAcount){
                   return done(null, false, {message: 'Pending Account. Please Verify Your Email!'});
               }
               if(wsession)
               req.session.cookie.expires = new Date(Date.now() + minutos);
               return done(null, user, {message: 'Logueo exitoso'});
          })
          .catch(err => { return done(err)});
    }
    ));

    passport.authenticate('local', {session: false}, (err, user, info) => {    
        const sessionUser = user ? {
            id : user.id,
            username : user.userName,
            email : user.mail
        } : {};   
        if (err || !user) {
            return res.status(401).json(info);
        }
        user = {
            "mail" : user.mail,
            "name" : user.userName,
            "mobilePhone" : user.mobilePhone,
            "imgURL" : user.imgURL
        }
       req.login(user, {session: false}, (err) => {
           if (err) {
               res.send(err);
           }
           // generate a signed son web token with the contents of user object and return it in the response
           const token = jwt.sign({user}, process.env.JWTKEY, {
           algorithm: "HS256",
           expiresIn: jwtExpirySeconds,
           });
           if(wsession)
           req.session.user = sessionUser;
           res.cookie("token", token, { maxAge: jwtExpirySeconds * 1000, sameSite: 'lax', secure: false});
           res.json({user, token});
           res.end()
        });
    })(req, res);
}  

exports.updateUser = async function (req, res, repository){
    let userRepository = repository;
    var finduser = await userRepository.findOne({where : {id : req.session.user.id}});

    var form = new formidable.IncomingForm();

    form.parse(req, function(err, fields, files) {
       if (err) {
         console.error(err.message);
         res.status(500).end();
         return;
        }

        if (typeof finduser != "undefined"){
         Promise.all([
           Object.keys(fields).length != 0 ?
            controldata.checkMobilePhone(codArea + fields.mobilePhone).then(error => {
               if (typeof error != "undefined"){
                   return error;
               }   
               finduser.mobilePhone = codArea + fields.mobilePhone; 
            }) : undefined,
           Object.keys(files).length != 0 ?   
            controldata.validateIMG(files).then(error => {
                if (typeof error != "undefined"){
                   console.log(error);
                   return error;
                }
                finduser.imgURL = fileupload(files);
            }) : undefined ]).then(values => {
               if (typeof values[0] == "undefined" && typeof values[1] == "undefined"){
                   userRepository.save(finduser);
                   res.status(200).json({"message" : "User updated."}).end();
               }
               typeof values[0] != "undefined" ? res.status(400).json(values[0]).end() : res.status(400).json(values[1]).end();      
            })
        }

    });

}

exports.logOut = async function (req,res){
    req.session.destroy(function(err) {
        if(err){
            res.status(500).end(JSON.stringify({message : err}))
        }
        res.clearCookie("token");
        res.clearCookie("id");
        res.status(201).json({message : "Sesion closed"}).end()
      });
}

exports.currentUser = async function (req, res, repository){
    let userRepository = repository;
    let user,id;
    if (req.cookies.token) {
       const token = req.cookies.token;
       const decoded = await promisify(jwt.verify)(token, process.env.JWTKEY);
      user = await userRepository.findOne({where : {'mail' : decoded.user.mail}});
      id = user.id;
      user = {
       "name" : user.userName,
       "email" : user.mail,
       "mobilePhone" : user.mobilePhone,
       "imgURL" : user.imgURL
      }
   } else {
    user = {
        "name" : null,
        "email" : null,
        "mobilePhone" : null,
        "imgURL" : null
       }
  }
   res.cookie("id",id);
   res.status(200).json(user).end();
}

exports.authenticateMail = async function (req, res, repository){
    let userRepository = repository;
    userRepository.findOne({where : {confirmationCode: req.params.confirmationCode,}}).then((user) => {
          if (!user) {
            return res.status(404).send({ message: "User Not found." });
          }
    
          user.verifiedAcount = true;

          userRepository.save(user);

          return res.status(200).send({ message: "Confirmed email." });
        })
        .catch((e) => {console.log("error", e); return res.status(500).send({ message: "Server error." });});    
}

exports.resetPassword = async function (req, res, repository){
    let userRepository = repository;
    userRepository.findOne({where : {confirmationCode: req.body.code}}).then((user) => {
        if (!user) {
          return res.status(404).send({ message: "Invalid confirmation code." });
        }
        createHash(req.body.password).then(res =>{user.password = res});

        userRepository.save(user);

        return res.status(200).send({ message: "password changed successfully" });
      })
      .catch((e) => {console.log("error ", e); return res.status(500).send({ message: "Error can´t change the password." })});
}

exports.forgotPasswordMail = async function (req, res, repository){
    let userRepository = repository;
    userRepository.findOne({where : {mail: req.body.mail}}).then((user) => {
        if (!user) {
          return res.status(404).send({ message: "User Not found." });
        }
        user.confirmationCode = jwt.sign({email: req.body.mail}, process.env.JWTKEY);

        userRepository.save(user).then(()=>{
            nodemailer.sendForgotPasswordEmail(req.body.mail,user.confirmationCode);
            return res.status(200).send({ message: "Please check your email for reset your password" });
        });
        
    })
    .catch((e) => {res.status(500).send({ message: "Server error cannot reset password." }); console.log("error", e)});
}