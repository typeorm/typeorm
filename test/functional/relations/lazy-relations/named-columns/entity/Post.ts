import {
    Column,
    Entity,
    JoinColumn,
    JoinTable,
    ManyToMany,
    ManyToOne,
    OneToOne,
    PrimaryGeneratedColumn
} from "@typeorm/core";
import { Category, } from "./Category";

@Entity()
export class Post {

    @PrimaryGeneratedColumn({
        name: "s_post_id"
    })
    id: number;

    @Column()
    title: string;

    @Column()
    text: string;

    @ManyToMany(type => Category)
    @JoinTable()
    categories: Promise<Category[]>;

    @ManyToMany(type => Category, category => category.twoSidePosts)
    @JoinTable()
    twoSideCategories: Promise<Category[]>;

    @Column()
    viewCount: number = 0;

    @ManyToOne(type => Category)
    category: Promise<Category>;

    @OneToOne(type => Category, category => category.onePost)
    @JoinColumn()
    oneCategory: Promise<Category>;

    @ManyToOne(type => Category, category => category.twoSidePosts2)
    twoSideCategory: Promise<Category>;

    // ManyToMany with named properties
    @ManyToMany(type => Category, category => category.postsNamedColumn)
    @JoinTable()
    categoriesNamedColumn: Promise<Category[]>;

    // ManyToOne with named properties
    @ManyToOne(type => Category, category => category.onePostsNamedColumn)
    @JoinColumn({
        name: "s_category_named_column_id"
    })
    categoryNamedColumn: Promise<Category>;

    // OneToOne with named properties
    @OneToOne(type => Category, category => category.onePostNamedColumn)
    @JoinColumn({
        name: "s_one_category_named_column_id"
    })
    oneCategoryNamedColumn: Promise<Category>;
}
