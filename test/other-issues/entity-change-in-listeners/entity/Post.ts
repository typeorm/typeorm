import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { BeforeUpdate } from "typeorm/decorator/listeners/BeforeUpdate"
import { UpdateDateColumn } from "typeorm/decorator/columns/UpdateDateColumn"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column({ default: false })
    active: boolean

    @UpdateDateColumn()
    updateDate: Date

    @BeforeUpdate()
    beforeUpdate() {
        this.title += "!"
    }
}
