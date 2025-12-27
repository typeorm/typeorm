import { Entity } from "../../../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../../../../../../src/decorator/columns/Column"
import { TableInheritance } from "../../../../../../src/decorator/entity/TableInheritance"
import { Counters } from "./Counters"

@Entity()
@TableInheritance({ column: { type: "varchar", name: "type" } })
export class Content {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column(() => Counters, { prefix: false })
    counters: Counters
}
