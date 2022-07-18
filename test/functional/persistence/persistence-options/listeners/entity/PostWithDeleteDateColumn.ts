import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { DeleteDateColumn } from "typeorm/decorator/columns/DeleteDateColumn"
import { AfterSoftRemove, BeforeSoftRemove } from "typeorm"

@Entity()
export class PostWithDeleteDateColumn {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column()
    description: string

    @DeleteDateColumn()
    deletedAt: Date

    isSoftRemoved: boolean = false

    @BeforeSoftRemove()
    beforeSoftRemove() {
        this.title += "!"
    }

    @AfterSoftRemove()
    afterSoftRemove() {
        this.isSoftRemoved = true
    }
}
