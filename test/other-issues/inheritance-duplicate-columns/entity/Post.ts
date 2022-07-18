import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { BasePost } from "./BasePost"

@Entity()
export class Post extends BasePost {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column({ default: false })
    active: boolean
}
