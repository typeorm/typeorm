import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";
import { PostStatus } from "../model/PostStatus";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column({nullable: false})
    status: PostStatus;

}
