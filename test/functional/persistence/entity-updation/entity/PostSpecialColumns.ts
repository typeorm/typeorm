import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { CreateDateColumn } from "typeorm/decorator/columns/CreateDateColumn"
import { UpdateDateColumn } from "typeorm/decorator/columns/UpdateDateColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { VersionColumn } from "typeorm/decorator/columns/VersionColumn"

@Entity()
export class PostSpecialColumns {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @CreateDateColumn()
    createDate: Date

    @UpdateDateColumn()
    updateDate: Date

    @VersionColumn()
    version: number
}
