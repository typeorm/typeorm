import { AccessToken } from "./AccessToken";
import { Column, Entity, Generated, OneToOne, PrimaryColumn } from "@typeorm/core";

@Entity()
export class User {

    @PrimaryColumn("int")
    @Generated()
    primaryKey: number;

    @Column()
    email: string;

    @OneToOne(type => AccessToken, token => token.user)
    access_token: AccessToken;

}
