import { Column } from "../../../../../../src/decorator/columns/Column"
import { Information } from "./Information"
import { BeforeInsert } from "../../../../../../src"

export class Counters {
    @Column()
    likes: number

    @Column((type) => Information)
    information?: Information

    @BeforeInsert()
    beforeInsert() {
        this.likes = 100
    }
}
