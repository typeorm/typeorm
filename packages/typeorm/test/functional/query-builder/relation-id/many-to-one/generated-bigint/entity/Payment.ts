import { PrimaryGeneratedColumn } from "../../../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Entity } from "../../../../../../../src/decorator/entity/Entity"
import { ManyToOne } from "../../../../../../../src/decorator/relations/ManyToOne"
import { RelationId } from "../../../../../../../src/decorator/relations/RelationId"
import { Account } from "./Account"

@Entity()
export class Payment {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(() => Account)
    account: Account

    @RelationId((payment: Payment) => payment.account)
    accountId: string
}
