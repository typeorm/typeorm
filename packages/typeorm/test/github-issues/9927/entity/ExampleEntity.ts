import { Entity } from "../../../../src/decorator/entity/Entity"
import { Column } from "../../../../src/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "../../../../src/decorator/columns/PrimaryGeneratedColumn"

@Entity()
export class ExampleEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column({
        type: "int",
        name: "serial_no_id",
        nullable: false,
        default: 0,
    })
    serialNoId: number
}
