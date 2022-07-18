import { Column } from "typeorm/decorator/columns/Column"
import { BeforeInsert } from "typeorm/decorator/listeners/BeforeInsert"
import { BeforeUpdate } from "typeorm/decorator/listeners/BeforeUpdate"

export class PostCounter {
    @Column({ nullable: true })
    likes: number

    @BeforeInsert()
    beforeInsert() {
        this.likes = 0
    }

    @BeforeUpdate()
    beforeUpdate() {
        this.likes++
    }
}
