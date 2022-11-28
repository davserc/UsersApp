import { AppDataSource } from "./data-source"
import { Users } from "./entity/Users"
export { singUp,
         singIn,
         updateUser,
         logOut,
         currentUser,
         authenticateMail,
         forgotPasswordMail,
         resetPassword } from "./server/user.service"

AppDataSource.initialize().then(async () => {
    let userRepository = AppDataSource.getRepository(Users);
    let finduser = await userRepository.findOne({where : { mail: "Admin@admin.com" }});
    if(!finduser){
       const user = new Users()
       user.mail = "Admin@admin.com"
       user.userName = "admin"
       user.password = "admin"
       await AppDataSource.manager.save(user)
    }

}).catch(error => console.log(error))
