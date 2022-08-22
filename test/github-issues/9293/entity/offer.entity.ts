import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "../../../../src"
import Lender from "./lender.entity"

@Entity("Offer")
export default class Offer {
    @PrimaryGeneratedColumn("increment")
    id: number

    @Column("int")
    lenderId: number

    @Column("int")
    rate: number

    @ManyToOne(() => Lender, (lender) => lender.offers)
    @JoinColumn([{ name: "lenderId", referencedColumnName: "id" }])
    lender: Lender
}
