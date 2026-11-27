import { Column } from "../../../../../../src/decorator/columns/Column"
import { BeforeInsert } from "../../../../../../src"

export class Tags {
    @Column()
    name: string

    @Column()
    used?: number

    @BeforeInsert()
    beforeInsert() {
        this.used = 100
    }
}
