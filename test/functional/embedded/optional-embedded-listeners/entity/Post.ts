import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { PostInformation } from "./PostInformation"
import { Index } from "typeorm/decorator/Index"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    @Index()
    title: string

    @Column()
    text: string

    @Column((type) => PostInformation, { prefix: "info" })
    information?: PostInformation
}
