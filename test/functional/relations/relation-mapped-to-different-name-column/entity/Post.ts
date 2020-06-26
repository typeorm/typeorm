import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "@typeorm/core";
import { PostDetails } from "./PostDetails";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @OneToOne(type => PostDetails)
    @JoinColumn()
    details: PostDetails;

    @Column()
    title: string;

}
