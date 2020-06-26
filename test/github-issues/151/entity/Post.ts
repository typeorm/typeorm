import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "@typeorm/core";
import { Category } from "./Category";
import { PostMetadata } from "./PostMetadata";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @OneToOne(type => Category, {cascade: true})
    @JoinColumn()
    category: Category | null;

    @OneToOne(type => PostMetadata, metadata => metadata.post, {cascade: true})
    @JoinColumn()
    metadata: PostMetadata | null;

}
