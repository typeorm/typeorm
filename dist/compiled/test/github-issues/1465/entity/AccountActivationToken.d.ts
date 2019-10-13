import { Token } from "./Token";
import { Account } from "./Account";
export declare class AccountActivationToken extends Token {
    tokenSecret: string;
    expiresOn: Date;
    account: Account;
    constructor(tokenSecret: string, expiresOn: Date);
}
