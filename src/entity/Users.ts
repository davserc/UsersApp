import {Entity, PrimaryGeneratedColumn, PrimaryColumn, Column} from "typeorm";

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
