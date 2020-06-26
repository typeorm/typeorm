import { Entity, JoinColumn, OneToOne, TableInheritance } from "@typeorm/core";
import { Token } from "./Token";
import { Account } from "./Account";

@Entity()
@TableInheritance({column: {type: "varchar", name: "type"}})
export class AccountActivationToken extends Token {
    @OneToOne(type => Account, "accountActivationToken", {
        cascade: ["insert", "update"]
    })
    @JoinColumn()
    account: Account;

    constructor(public tokenSecret: string, public expiresOn: Date) {
        super();
    }
}
