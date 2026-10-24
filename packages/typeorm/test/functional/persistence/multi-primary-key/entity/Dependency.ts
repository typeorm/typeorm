import { Column, Entity, ManyToOne, PrimaryColumn } from "../../../../../src"
import { Example } from "./Example"

@Entity()
export class Dependency {
    @PrimaryColumn()
    fromId: number

    @ManyToOne(() => Example, (example) => example.dependencies, {
        orphanedRowAction: "delete",
    })
    from: Example

    @PrimaryColumn()
    toId: number

    @ManyToOne(() => Example, {
        orphanedRowAction: "delete",
    })
    to: Example

    @Column()
    label: string
}
