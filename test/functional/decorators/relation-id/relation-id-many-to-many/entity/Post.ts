import { Column, Entity, JoinTable, ManyToMany, PrimaryColumn, RelationId } from "@typeorm/core";
import { Category } from "./Category";

@Entity()
export class Post {

    @PrimaryColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    isRemoved: boolean = false;

    @ManyToMany(type => Category, category => category.posts)
    @JoinTable()
    categories: Category[];

    @ManyToMany(type => Category)
    @JoinTable()
    subcategories: Category[];

    @RelationId((post: Post) => post.categories)
    categoryIds: number[];

    @RelationId((post: Post) => post.categories, "rc", qb => qb.andWhere("rc.isRemoved = :isRemoved", {isRemoved: true}))
    removedCategoryIds: number[];

    @RelationId((post: Post) => post.subcategories)
    subcategoryIds: number[];

    @RelationId((post: Post) => post.subcategories, "rsc", qb => qb.andWhere("rsc.isRemoved = :isRemoved", {isRemoved: true}))
    removedSubcategoryIds: number[];

}
