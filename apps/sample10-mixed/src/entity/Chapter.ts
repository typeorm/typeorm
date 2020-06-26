import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "@typeorm/core";
import { PostDetails } from "./PostDetails";

@Entity("sample10_chapter")
export class Chapter {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    about: string;

    @OneToMany(type => PostDetails, postDetails => postDetails.chapter)
    postDetails: PostDetails[];

}
