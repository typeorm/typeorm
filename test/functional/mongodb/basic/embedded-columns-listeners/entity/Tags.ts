import { Column } from "typeorm/decorator/columns/Column"
import { BeforeInsert } from "typeorm"

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
