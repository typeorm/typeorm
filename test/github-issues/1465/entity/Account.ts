import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from "@typeorm/core";
import { AccountActivationToken } from "./AccountActivationToken";

@Entity()
export class Account {
    @PrimaryGeneratedColumn() id: number;

    @OneToOne(type => AccountActivationToken, "account", {cascade: ["insert", "remove"]})
    accountActivationToken: AccountActivationToken;

    @Column() username: string;

    @Column() password: string;
}
