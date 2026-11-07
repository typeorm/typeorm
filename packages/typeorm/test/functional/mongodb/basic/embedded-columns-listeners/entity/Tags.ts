import { Column } from "../../../../../../src/decorator/columns/Column"
import { AfterLoad, BeforeInsert } from "../../../../../../src"

export class Tags {
    @Column()
    name: string

    @Column()
    used?: number

    loaded: boolean = false

    @BeforeInsert()
    beforeInsert() {
        this.used = 100
    }

    @AfterLoad()
    async afterLoad() {
        await new Promise((resolve) => setTimeout(resolve, 10))
        this.loaded = true
    }
}
