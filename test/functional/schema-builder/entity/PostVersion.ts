import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "@typeorm/core";
import { Post } from "./Post";

@Entity()
export class PostVersion {

    @PrimaryColumn()
    id: number;

    @ManyToOne(type => Post)
    @JoinColumn({referencedColumnName: "version"})
    post: Post;

    @Column()
    details: string;

}
