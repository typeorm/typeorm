import { Column, Entity, OneToMany, PrimaryColumn, RelationCount } from "@typeorm/core";
import { Category } from "./Category";

@Entity()
export class Post {

    @PrimaryColumn()
    id: number;

    @Column()
    title: string;

    @OneToMany(type => Category, category => category.post)
    categories: Category[];

    @RelationCount((post: Post) => post.categories)
    categoryCount: number;

    @RelationCount((post: Post) => post.categories, "rc", qb => qb.andWhere("rc.isRemoved = :isRemoved", {isRemoved: true}))
    removedCategoryCount: number;

}
