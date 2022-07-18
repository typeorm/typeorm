import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"
import { Column } from "typeorm/decorator/columns/Column"

@Entity()
export class Example {
    @PrimaryColumn()
    id: Date

    @Column()
    text: string
}
