import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "@typeorm/core";
import { Post } from "./post.entity";

@Entity("tag_test", {schema: "public"})
export class Tag extends BaseEntity {

    @PrimaryColumn()
    id: number;

    @Column()
    name: string;

    @ManyToOne(() => Post)
    @JoinColumn({name: "tag_to_post"})
    posts: Post | null;
}
