import "reflect-metadata";
import { AppDataSource } from "../data-source";
import {Users} from "../entity/Users";
const { promisify } = require('util');
const controldata = require('../lib/controldata.lib');
const bcrypt = require('bcrypt');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const jwt = require('jsonwebtoken');
const nodemailer = require("./authMail.service");
const jwtExpirySeconds = 86400;
const codArea : string = '549'; //solo codigo area argentina
require('dotenv').config();

// Generates hash using bCrypt
var createHash = async function(password){
    return bcrypt.hashSync(password, bcrypt.genSaltSync(10), null);
}
  
// Validated password
var validatePassword = function(user, password){   
    return bcrypt.compareSync(password, user.password);   
}

export async function singUp (req,res){
    try{
        let userRepository = AppDataSource.getRepository(Users);
        let finduser = await userRepository.findOne({where : { mail: req.body.mail }});
        let error = await checkUserData(req,res,finduser)
        if(error){
            res.status(400).end(JSON.stringify(error));
            return;
        }
            
  
            const user = new Users();
            user.mail = req.body.mail;
            user.userName = req.body.username;
            user.password = await createHash(req.body.password);
            user.mobilePhone = req.body.mobilephone != undefined? codArea + req.body.mobilephone : '';
            user.creationDate = new Date();
            user.confirmationCode = jwt.sign({email: req.body.mail}, process.env.JWTKEY)
            await userRepository.save(user);            

            await nodemailer.sendConfirmationEmail(
                user.userName,
                user.mail,
                user.confirmationCode
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
export async function checkUserData (req,res,user){
    let error : object = {};
    if(user != undefined){
        error = {status : 400, message : "El correo ya se encuentra registrado", code : 1};        
    };

    if(!(await controldata.checkPassword(req.body.password))){
        error = {status : 400, message : "Invalid format Password", code : 2};
    }  
    
    if(!(await controldata.checkMail(req.body.mail))){
        error = {status : 400, message : "Invalid format Mail", code : 1};
    }

    if(req.body.mobilephone != undefined && !(await controldata.checkMobilePhone(codArea + req.body.mobilephone))){
        error = {status : 400, message : "Invalid format mobilephone", code : 3};
    }
    return error;
}

export async function singIn (req,res){
    passport.use(new LocalStrategy(
        {
            usernameField: 'mail',
            passwordField: 'password',
            session: false
        }, 
    function (mail, password, cb) {
        let userRepository = AppDataSource.getRepository(Users);
        let minutos = 600000;
        //this one is typically a DB call. Assume that the returned user object is pre-formatted and ready for storing in JWT
        return userRepository.findOne({where : {mail: mail}})
           .then(user => {
               if (!user || !validatePassword(user,password)) {
                   return cb(null, false, {message: 'Mail o password Incorrecto.'});
               }
               if(!user.verifiedAcount){
                   return cb(null, false, {message: 'Pending Account. Please Verify Your Email!'});
               }
               //req.session.userid = user.id;
               req.session.cookie.expires = new Date(Date.now() + minutos);
               return cb(null, user, {message: 'Logueo exitoso'});
          })
          .catch(err => cb(err));
    }
    ));

    passport.authenticate('local', {session: false}, (err, user, info) => {    
        const sessionUser = {
            id : user.id,
            username : user.userName,
            email : user.mail
        }    
        if (err || !user) {
            return res.status(401).json(info);
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

           req.session.user = sessionUser;
           res.cookie("token", token, { maxAge: jwtExpirySeconds * 1000, sameSite: 'lax', secure: false});
           res.json({user, token});
           res.end()
        });
    })(req, res);
}  

export async function updateUser (req,res){
    let userRepository = AppDataSource.getRepository(Users);
    let finduser = await userRepository.findOne({where : {id : req.session.userID}});
    if (finduser != undefined){
        if(req.body.password != undefined)
          finduser.password = await createHash(req.body.password);
        if(req.body.mobilephone != undefined)
          finduser.mobilePhone = codArea + req.body.mobilephone;
        await userRepository.save(finduser);
    }

    res.status(201).end(JSON.stringify(finduser))
}

export async function logOut (req,res){
    req.session.destroy(function(err) {
        if(err){
            res.status(500).end(JSON.stringify({message : err}))
        }
        res.clearCookie("token");
        res.status(201).end(JSON.stringify({message : "Sesion cerrada"}))
      });
}

export async function currentUser (req,res){
    let userRepository = AppDataSource.getRepository(Users);
    let user,id,username,email;
    //console.log(req.session);
    if (req.cookies.token) {
       const token = req.cookies.token;
       const decoded = await promisify(jwt.verify)(token, process.env.JWTKEY);
      // console.log(decoded);
      user = await userRepository.findOne({where : {'mail' : decoded.user.mail}});
      id = user.id;
      username = user.userName;
      email = user.mail;
   } else {
    id = null;
    username = null;
    email = null;
  }
   res.cookie("id",id,"username",username,"email",email)
//    res.cookie("email",email)
//    res.cookie("username",username)
   res.status(200).end();
}

export async function authenticateMail (req,res){
    let userRepository = AppDataSource.getRepository(Users);
    userRepository.findOne({where : {confirmationCode: req.params.confirmationCode,}}).then((user) => {
          if (!user) {
            return res.status(404).send({ message: "User Not found." });
          }
    
          user.verifiedAcount = true;

          userRepository.save(user);
        })
        .catch((e) => console.log("error", e));    
}

export async function resetPassword (req,res){
    let userRepository = AppDataSource.getRepository(Users);
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

export async function forgotPasswordMail (req,res){
    let userRepository = AppDataSource.getRepository(Users);
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
    .catch((e) => {res.status(500).send({ message: "Error en servidor no se puede restastaurar el password." }); console.log("error", e)});
}