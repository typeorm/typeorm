import { Entity, PrimaryGeneratedColumn } from "../../../../../../../src"

/**
 * The "customer" table before the one-to-one relation to Profile exists.
 */
@Entity("customer")
export class CustomerWithoutRelation {
    @PrimaryGeneratedColumn()
    id: number
}
