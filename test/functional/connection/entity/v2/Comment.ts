import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { ManyToOne } from "typeorm/decorator/relations/ManyToOne"
import { Index } from "typeorm/decorator/Index"
import { Guest } from "./Guest"

@Entity()
@Index("author_and_title_unique_rename", ["author", "title", "context"], {
    unique: true,
})
export class Comment {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    @Index()
    title: string

    @Column()
    context: string

    @ManyToOne((type) => Guest, (guest) => guest.comments)
    author: Guest
}
