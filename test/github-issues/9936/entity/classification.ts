import { Entity, ManyToOne, PrimaryColumn } from "../../../../src"
import { RandomGenerator } from "../../../../src/util/RandomGenerator"

@Entity()
export class Classification {
    constructor() {
        this.id = RandomGenerator.uuidv4()
    }

    @PrimaryColumn({ type: "uuid" })
    id: string

    @ManyToOne(() => Classification)
    parent?: Classification | null
}
