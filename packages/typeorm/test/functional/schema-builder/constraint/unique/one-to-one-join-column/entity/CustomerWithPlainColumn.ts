import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
} from "../../../../../../../src"

/**
 * The "customer" table with a plain "profileId" column that is not yet a
 * one-to-one join column.
 */
@Entity("customer")
export class CustomerWithPlainColumn {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ nullable: true })
    profileId: number
}
