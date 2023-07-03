import { Entity } from "../../../../src/decorator/entity/Entity"
import { Column } from "../../../../src/decorator/columns/Column"
import { BeforeUpdate } from "../../../../src/decorator/listeners/BeforeUpdate"
import { UpdateDateColumn } from "../../../../src/decorator/columns/UpdateDateColumn"
import { AfterLoad, ObjectIdColumn } from "../../../../src"

@Entity()
export class Post {
    @ObjectIdColumn()
    id: number

    @Column()
    title: string

    @Column({ default: false })
    active: boolean

    @UpdateDateColumn()
    updateDate: Date

    @BeforeUpdate()
    async beforeUpdate() {
        this.title += "!"
    }

    loaded: Boolean = false

    @AfterLoad()
    async afterLoad() {
        this.loaded = true
    }
}
