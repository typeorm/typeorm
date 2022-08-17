import {
    Column,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
} from "../../../../src"
import Offer from "./offer.entity"

@Entity("Lender")
export default class Lender {
    @PrimaryGeneratedColumn("increment")
    id: number

    @Column("varchar")
    name: string

    @OneToMany(() => Offer, (offer: Offer) => offer.lender)
    offers: Offer[]
}
