import { Column } from "typeorm/decorator/columns/Column"
import { Information } from "./Information"
import { BeforeInsert } from "typeorm"

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
