const validator = require ('validator');
require('dotenv').config();

exports.checkPassword = async function (pas) {
    return ((validator.isStrongPassword(pas,{minLength: 8, minLowercase: 1, minUppercase: 1, 
                                       minNumbers: 1, minSymbols: 0, returnScore: true, 
                                       pointsPerUnique: 1, pointsPerRepeat: 0.5, 
                                       pointsForContainingLower: 10, pointsForContainingUpper: 10, 
                                       pointsForContainingNumber: 10, pointsForContainingSymbol: 10}) >= 30) && pas.length <= 500)? undefined : {"message" : "Invalid format Password."};
}

exports.checkMail = async function (mail){
    return validator.isEmail(mail) && mail.length <= 200? undefined : {"message" : "Invalid format Mail."}; 
}

exports.checkMobilePhone = async function (phone){
    return validator.isMobilePhone(phone,process.env.MOBILEPHONE_REGION,{strictMode:false})? undefined : {"message" : "Invalid format mobilephone."};
}

exports.validateIMG = async function (files){
    formats = process.env.VALID_FILEFORMAT.split(",");
    let format = formats.find(f => f === files.img.mimetype);
    let size = files.img.size;
    //control max size 2MB.
    if(size > process.env.VALID_FILESIZE)
     return {"message" : "The image size is greater than 2 MB."};
    //control valids format.
    if(typeof format == "undefined")
     return {"message" : "The image format is not valid."};
    return undefined;
}