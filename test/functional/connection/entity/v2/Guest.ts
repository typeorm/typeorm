import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "@typeorm/core";
import { Comment } from "./Comment";

@Entity()
export class Guest {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    username: string;

    @OneToMany(type => Comment, comment => comment.author)
    comments: Comment[];
}
