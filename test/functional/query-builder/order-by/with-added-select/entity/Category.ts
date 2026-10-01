import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
} from "../../../../../../src/index"

@Entity()
export class Category {
    @PrimaryGeneratedColumn()
    id: number

    // SAP HANA rejects `INSERT ... VALUES (DEFAULT)` for all-defaults rows,
    // so the entity needs at least one non-PK column with a default value
    // for the test's many-to-many setup to insert categories portably.
    // Oracle treats empty-string defaults as NULL (violating NOT NULL), so
    // the default must be a non-empty value.
    @Column({ default: "cat" })
    name: string
}
