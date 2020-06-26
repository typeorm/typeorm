import { Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn, RelationId } from "@typeorm/core";
import { Category } from "./Category";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @OneToMany(type => Category, category => category.post)
    categories: Category[];

    @RelationId((post: Post) => post.categories)
    categoryIds: { firstId: number, secondId: number }[];

    @ManyToMany(type => Category, category => category.manyPosts)
    @JoinTable()
    manyCategories: Category[];

    @RelationId((post: Post) => post.manyCategories)
    manyCategoryIds: { firstId: number, secondId: number }[];

}
