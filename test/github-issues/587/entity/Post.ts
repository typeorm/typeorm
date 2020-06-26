import { Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from "@typeorm/core";
import { Tag } from "./Tag";

@Index(["a", "b", "c", "tag"])
@Index(["b", "tag", "c"])
@Index(["c", "a"])
@Entity("Posts")
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    a: string;

    @Column()
    b: string;

    @Column()
    c: string;

    @ManyToOne(() => Tag)
    tag: Tag;
}
