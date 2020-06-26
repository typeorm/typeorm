import { Column, Entity, OneToOne, PrimaryColumn } from "@typeorm/core";
import { PostWithRelation } from "./PostWithRelation";

@Entity()
export class CategoryWithRelation {

    @PrimaryColumn()
    id: number;

    @Column({unique: true})
    name: string;

    @OneToOne(type => PostWithRelation, post => post.category)
    post: PostWithRelation;
}
