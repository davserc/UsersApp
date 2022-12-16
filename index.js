const _user = require('./src/server/user.service')

Object.defineProperty(exports, "__esModule", {
    value: true
  });

var user = {
    singIn: _user.singIn,
    singUp: _user.singUp,
    logOut: _user.logOut,
    authenticateMail: _user.authenticateMail,
    forgotPasswordMail: _user.forgotPasswordMail,
    currentUser: _user.currentUser,
    resetPassword: _user.resetPassword,
    updateUser: _user.updateUser
}
console.log(user);
var _default = user;
exports.default = _default;
module.exports = exports.default;
module.exports.default = exports.default;