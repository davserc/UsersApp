# UsersApp
User account management.

## Requirements
1. Have typeorm and postgresql installed.
2. Configure .env file.
  - USER_MAIL=[mailuser@example.com] /*mail manager configuration*/
  - PASS_MAIL=[password123]
  - JWTKEY=[abc123]
  - EXPIRYSECONDS=[86400]
  - FRONTEND_CONFIRMATIONEMAIL_PATH=[http://localhost:3000/confirm/]
  - FRONTEND_FORGOTPASSWORD_PATH=[http://localhost:3000/password/]
  - FILE_FOLDER_PATH = "imgs/"
  -	VALID_FILESIZE = 2000000
  -	VALID_FILEFORMAT = "image/jpeg,image/webp,image/svg+xml"
  - MOBILEPHONE_REGION = "es-AR" /*validator npm isMobilePhone*/

### Functions
- singIn function (req, res, repository, wsession)
Description: This function is for user authentication and session initialization.
- singUp function (req, res, repository, user)
Description: This function is to create a user account.
- updateUser function (req, res, repository)
Description: This function is to update user account information.
- logOut function (req, res)
Description: This function is to exit the session.
- currentUser function (req, res, repository)
Description: This function returns session information for the current user.
- authenticateMail function (req, res, repository)
Description: This function is to authenticate the user's mail account.
- resetPassword function (req, res, repository)
Description: This function finds the user account with the confirmation code generated by the forgotPasswordMail function and resets the user account password.
- forgotPasswordMail function (req, res, repository)
Description: This function generates a confirmation code, associates it with the user account, and sends an email to reset the user account password.

### Function variables
-repository is the user repository.
-user is an instance of the user entity.
-wsession true/false if it implements 'express-session'.
Expected structure:
```
@Entity()
export class Users {

    @PrimaryGeneratedColumn()
    id: number;

    @PrimaryColumn("varchar", { length: 200 })
    mail: string;

    @Column("varchar", { length: 60 })
    userName: string;    

    @Column("varchar", { length: 500 })
    password: string;

    @Column("varchar", { length: 15, default: null})
    mobilePhone: string;

    @Column({default: false})
    verifiedAcount: boolean;

    @Column("date")
    creationDate: Date;

    @Column("varchar",{default: null})
    imgURL: string;

    @Column("varchar",{ length: 200 })
    confirmationCode: string; 
} 
```

#### Implementation example : https://github.com/davserc/testUserApp