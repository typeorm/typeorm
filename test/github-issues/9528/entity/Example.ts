import { Entity } from "../../../../src/decorator/entity/Entity"
import { PrimaryColumn } from "../../../../src/decorator/columns/PrimaryColumn"
import { Column } from "../../../../src/decorator/columns/Column"

@Entity('example')
export class Example {
    @PrimaryColumn()
    id: Date

    @Column()
    text: string
}
