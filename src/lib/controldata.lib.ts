import validator from 'validator';

async function checkPassword (pas) {
    return ((validator.isStrongPassword(pas,{minLength: 8, minLowercase: 1, minUppercase: 1, 
                                       minNumbers: 1, minSymbols: 0, returnScore: true, 
                                       pointsPerUnique: 1, pointsPerRepeat: 0.5, 
                                       pointsForContainingLower: 10, pointsForContainingUpper: 10, 
                                       pointsForContainingNumber: 10, pointsForContainingSymbol: 10}) >= 30) && pas.length <= 500)
}

async function checkMail (mail){
    return validator.isEmail(mail) && mail.length <= 200 
}

async function checkMobilePhone (phone){
    return validator.isMobilePhone(phone,'es-AR',{strictMode:false})
}

module.exports = {checkPassword,checkMail,checkMobilePhone};