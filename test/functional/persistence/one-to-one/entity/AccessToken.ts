import { Entity, Generated, JoinColumn, OneToOne, PrimaryColumn } from "@typeorm/core";
import { User } from "./User";

@Entity()
export class AccessToken {

    @PrimaryColumn("int")
    @Generated()
    primaryKey: number;

    @OneToOne(type => User, user => user.access_token)
    @JoinColumn()
    user: User;

}
