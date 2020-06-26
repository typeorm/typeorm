import { Column, Entity, Generated, OneToOne, PrimaryColumn } from "@typeorm/core";
import { User } from "./User";

@Entity()
export class AccessToken {

    @PrimaryColumn("int")
    @Generated()
    primaryKey: number;

    @Column()
    expireTime: number;

    @OneToOne(type => User, user => user.access_token, {
        cascade: true
    })
    user: User;

}
