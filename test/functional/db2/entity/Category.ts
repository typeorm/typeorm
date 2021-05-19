import { Entity } from "../../../../src/decorator/entity/Entity";
import { Column } from "../../../../src/decorator/columns/Column";
import { PrimaryGeneratedColumn } from "../../../../src/decorator/columns/PrimaryGeneratedColumn";
import { ManyToOne } from "../../../../src/decorator/relations/ManyToOne";
import { Post } from "./Post";

@Entity()
export class Category {
    @PrimaryGeneratedColumn()
    id: number;

    @Column("text")
    title: string;

    @ManyToOne((type) => Post, (post) => post.categories)
    post: Post;

    @Column({ nullable: true })
    isNew: boolean;
}
