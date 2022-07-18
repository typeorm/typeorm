import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"
import { BeforeUpdate } from "typeorm/decorator/listeners/BeforeUpdate"
import { UpdateDateColumn } from "typeorm/decorator/columns/UpdateDateColumn"
import { AfterLoad, ObjectIdColumn } from "typeorm"

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
