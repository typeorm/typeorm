import { AccessToken } from "./AccessToken";
import { Column, Entity, Generated, JoinColumn, OneToOne, PrimaryColumn } from "@typeorm/core";

@Entity()
export class User {

    @PrimaryColumn("int")
    @Generated()
    id: number;

    @Column()
    email: string;

    @OneToOne(type => AccessToken)
    @JoinColumn()
    access_token: AccessToken;

}
