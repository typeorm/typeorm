import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { VersionColumn } from "typeorm/decorator/columns/VersionColumn"
import { UpdateDateColumn } from "typeorm/decorator/columns/UpdateDateColumn"

@Entity("post_with_v_ud")
export class PostWithVersionAndUpdatedDate {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @VersionColumn()
    version: number

    @UpdateDateColumn()
    updateDate: Date
}
