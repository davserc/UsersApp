# UsersApp
User account management.

## Requirements
1. Have typeorm and postgresql installed.
2. Configure .env file.
  - USER_MAIL=[mailuser] /*mail manager configuration*/
  - PASS_MAIL=[password]
  - JWTKEY=[jwtkey]
  - EXPIRYSECONDS=[TokenExpirationSeconds]

### Functions
- singIn function (req, res, AppDataSource, Users)
Description: This function is for user authentication and session initialization.
- singUp function (req, res, AppDataSource, Users)
Description: This function is to create a user account.
- updateUser function (req, res, AppDataSource, Users)
Description: This function is to update user account information.
- logOut function (req, res)
Description: This function is to exit the session.
- currentUser function (req, res, AppDataSource, Users)
Description: This function returns session information for the current user.
- authenticateMail function (req, res, AppDataSource, Users)
Description: This function is to authenticate the user's mail account.
- resetPassword function (req, res, AppDataSource, Users)
Description: This function is to reset the user account password.
- forgotPasswordMail function (req, res, AppDataSource, Users)
Description: This function consists of sending an email to restore the password of the user account.

### Function variables
-AppDataSource is the typeorm connection.
-Users is the user entity model of your table in the database.
Expected structure:
```@Entity()
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
}```
