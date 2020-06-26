import { Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from "@typeorm/core";
import { Guest } from "./Guest";

@Entity()
@Index("author_and_title_unique_rename", ["author", "title", "context"], {unique: true})
export class Comment {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    @Index()
    title: string;

    @Column()
    context: string;

    @ManyToOne(type => Guest, guest => guest.comments)
    author: Guest;
}
