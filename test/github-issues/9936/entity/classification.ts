import { v4 } from "uuid"
import { Entity, ManyToOne, PrimaryColumn } from "../../../../src"

@Entity()
export class Classification {
    constructor() {
        this.id = v4()
    }

    @PrimaryColumn({ type: "uuid" })
    id: string

    @ManyToOne(() => Classification)
    parent?: Classification | null
}
