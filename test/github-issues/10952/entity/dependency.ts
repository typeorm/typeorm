import { Column, Entity, ManyToOne, PrimaryColumn } from "../../../../src"
import { Example } from "./example"

@Entity()
export class Dependency {
    @PrimaryColumn()
    fromId: number

    @ManyToOne(() => Example, (example: Example) => example.id, {
        orphanedRowAction: "delete",
    })
    from: Example

    @PrimaryColumn()
    toId: number

    @ManyToOne(() => Example, (example: Example) => example.id, {
        orphanedRowAction: "delete",
    })
    to: Example

    @Column()
    label: string
}
