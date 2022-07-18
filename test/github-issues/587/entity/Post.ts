import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { Index } from "typeorm/decorator/Index"
import { ManyToOne } from "typeorm/decorator/relations/ManyToOne"
import { Tag } from "./Tag"

@Index(["a", "b", "c", "tag"])
@Index(["b", "tag", "c"])
@Index(["c", "a"])
@Entity("Posts")
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    a: string

    @Column()
    b: string

    @Column()
    c: string

    @ManyToOne(() => Tag)
    tag: Tag
}
