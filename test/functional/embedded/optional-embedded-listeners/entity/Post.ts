import { Column, Entity, Index, PrimaryGeneratedColumn } from "@typeorm/core";
import { PostInformation } from "./PostInformation";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    @Index()
    title: string;

    @Column()
    text: string;

    @Column(type => PostInformation, {prefix: "info"})
    information?: PostInformation;

}
