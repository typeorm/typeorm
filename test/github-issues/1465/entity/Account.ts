import { Column } from "typeorm/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Entity } from "typeorm/decorator/entity/Entity"
import { AccountActivationToken } from "./AccountActivationToken"
import { OneToOne } from "typeorm/index"

@Entity()
export class Account {
    @PrimaryGeneratedColumn() id: number

    @OneToOne((type) => AccountActivationToken, "account", {
        cascade: ["insert", "remove"],
    })
    accountActivationToken: AccountActivationToken

    @Column() username: string

    @Column() password: string
}
