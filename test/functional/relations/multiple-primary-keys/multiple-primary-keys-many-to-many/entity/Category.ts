import { Column, Entity, ManyToMany, PrimaryColumn, Unique } from "@typeorm/core";
import { Post } from "./Post";
import { Tag } from "./Tag";

@Entity()
@Unique(["code", "version", "description"])
export class Category {

    @PrimaryColumn()
    name: string;

    @PrimaryColumn()
    type: string;

    @Column()
    code: number;

    @Column()
    version: number;

    @Column({nullable: true})
    description: string;

    @ManyToMany(type => Post, post => post.categories)
    posts: Post[];

    @ManyToMany(type => Post, post => post.categoriesWithOptions)
    postsWithOptions: Post[];

    @ManyToMany(type => Post, post => post.categoriesWithNonPKColumns)
    postsWithNonPKColumns: Post[];

    @ManyToMany(type => Tag, tag => tag.categories)
    tags: Tag[];

    @ManyToMany(type => Tag, tag => tag.categoriesWithOptions)
    tagsWithOptions: Tag[];

    @ManyToMany(type => Tag, tag => tag.categoriesWithNonPKColumns)
    tagsWithNonPKColumns: Tag[];

}
