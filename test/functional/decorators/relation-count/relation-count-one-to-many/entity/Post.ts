import {Entity} from "../../../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../../src/decorator/columns/Column";
import {OneToMany} from "../../../../../../src/decorator/relations/OneToMany";
import {RelationCount} from "../../../../../../src/decorator/relations/RelationCount";
import {Category} from "./Category";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;
    
    @OneToMany(type => Category, category => category.post)
    categories: Category[];

    @RelationCount((post: Post) => post.categories)
    categoryCount: number;

    @RelationCount((post: Post) => post.categories, "removedCategories", qb => qb.andWhere("removedCategories.isRemoved = :isRemoved", { isRemoved: true }))
    removedCategoryCount: number;

}