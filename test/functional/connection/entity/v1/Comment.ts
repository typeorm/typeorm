import { Column, Entity, Index, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "@typeorm/core";
import { Guest } from "./Guest";

@Entity()
@Index("author_and_title_unique", ["author", "title"], {unique: true})
export class Comment {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    @Index()
    title: string;

    @Column()
    context: string;

    @OneToMany(type => Comment, comment => comment.relay)
    reference?: Comment;

    @ManyToOne(type => Comment, comment => comment.reference)
    relay?: Comment;

    @ManyToOne(type => Guest, guest => guest.comments)
    author: Guest;
}
