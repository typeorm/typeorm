import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { CreateDateColumn } from "typeorm/decorator/columns/CreateDateColumn"
import { UpdateDateColumn } from "typeorm/decorator/columns/UpdateDateColumn"
import { VersionColumn } from "typeorm/decorator/columns/VersionColumn"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @CreateDateColumn()
    createDate: string

    @UpdateDateColumn()
    updateDate: string

    @Column({ default: 100 })
    order: number

    @VersionColumn()
    version: number
}
