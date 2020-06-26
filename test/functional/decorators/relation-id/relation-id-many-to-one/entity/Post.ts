import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, RelationId } from "@typeorm/core";
import { Category } from "./Category";

@Entity()
export class Post {

    @PrimaryColumn()
    id: number;

    @Column()
    title: string;

    @ManyToOne(type => Category)
    @JoinColumn()
    category: Category;

    @ManyToOne(type => Category)
    @JoinColumn({referencedColumnName: "name"})
    categoryByName: Category;

    @RelationId((post: Post) => post.category)
    categoryId: number;

    @RelationId((post: Post) => post.categoryByName)
    categoryName: string;

}
