import { Column, Entity, PrimaryGeneratedColumn, VersionColumn } from "@typeorm/core";

@Entity("sample17_post")
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    text: string;

    @VersionColumn()
    version: number;

}
