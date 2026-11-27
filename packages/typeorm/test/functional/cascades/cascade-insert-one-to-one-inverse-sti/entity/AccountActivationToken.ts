import { Token } from "./Token"
import { ChildEntity, OneToOne, JoinColumn } from "../../../../../src/index"
import { Account } from "./Account"

@ChildEntity()
export class AccountActivationToken extends Token {
    @OneToOne(() => Account, "accountActivationToken", {
        cascade: ["insert", "update"],
    })
    @JoinColumn()
    account: Account

    constructor(
        public tokenSecret: string,
        public expiresOn: Date,
    ) {
        super()
    }
}
