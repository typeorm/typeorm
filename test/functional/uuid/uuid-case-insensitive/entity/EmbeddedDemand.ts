import { Entity, Column } from "../../../../../src"
import { EmbeddedId } from "./EmbeddedId"

@Entity()
export class EmbeddedDemand {
    @Column(() => EmbeddedId)
    id: EmbeddedId

    @Column()
    name: string

    @Column()
    amount: number
}
