import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn, RelationId } from "@typeorm/core";
import { Category } from "./Category";

@Entity()
export class Post {

    @PrimaryColumn()
    id: number;

    @Column()
    title: string;

    @OneToOne(type => Category)
    @JoinColumn()
    category: Category;

    @OneToOne(type => Category)
    @JoinColumn({referencedColumnName: "name"})
    categoryByName: Category;

    @OneToOne(type => Category, category => category.post)
    @JoinColumn()
    category2: Category;

    @RelationId((post: Post) => post.category)
    categoryId: number;

    @RelationId((post: Post) => post.categoryByName)
    categoryName: string;

    @RelationId((post: Post) => post.category2)
    category2Id: number;

}
