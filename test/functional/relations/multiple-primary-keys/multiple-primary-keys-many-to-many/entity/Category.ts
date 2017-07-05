import {Entity} from "../../../../../../src/decorator/entity/Entity";
import {PrimaryColumn} from "../../../../../../src/decorator/columns/PrimaryColumn";
import {Column} from "../../../../../../src/decorator/columns/Column";
import {Index} from "../../../../../../src/decorator/Index";
import {Post} from "./Post";
import {ManyToMany} from "../../../../../../src/decorator/relations/ManyToMany";
import {Tag} from "./Tag";

@Entity()
@Index(["code", "version", "description"], { unique: true })
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

    @ManyToMany(type => Post, post => post.categoriesWithNonPrimaryColumns)
    postsWithNonPrimaryColumns: Post[];

    @ManyToMany(type => Tag, tag => tag.categories)
    tags: Tag[];

    @ManyToMany(type => Tag, tag => tag.categoriesWithOptions)
    tagsWithOptions: Tag[];

    @ManyToMany(type => Tag, tag => tag.categoriesWithNonPrimaryColumns)
    tagsWithNonPrimaryColumns: Tag[];

}