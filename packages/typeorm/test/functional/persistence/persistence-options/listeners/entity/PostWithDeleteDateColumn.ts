import { Entity } from "../../../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../../../../../../src/decorator/columns/Column"
import { DeleteDateColumn } from "../../../../../../src/decorator/columns/DeleteDateColumn"
import {
    AfterSoftRemove,
    BeforeRecover,
    BeforeSoftRemove,
    UpdateDateColumn,
    VersionColumn,
} from "../../../../../../src"

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

    @UpdateDateColumn()
    updatedAt: Date

    @VersionColumn()
    version: number

    isSoftRemoved: boolean = false

    @BeforeSoftRemove()
    beforeSoftRemove() {
        this.title += "!"
    }

    @AfterSoftRemove()
    afterSoftRemove() {
        this.isSoftRemoved = true
    }

    @BeforeRecover()
    beforeRecover() {
        this.title += "?"
    }
}
