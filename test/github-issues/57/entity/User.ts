import { AccessToken } from "./AccessToken";
import { Column, Entity, Generated, JoinColumn, OneToOne, PrimaryColumn } from "@typeorm/core";

@Entity()
export class User {

    @PrimaryColumn("int")
    @Generated()
    primaryKey: number;

    @Column()
    email: string;

    @OneToOne(type => AccessToken, token => token.user)
    @JoinColumn()
    access_token: AccessToken;

}
