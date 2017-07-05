import {Entity} from "../../../../../../../src/decorator/entity/Entity";
import {Column} from "../../../../../../../src/decorator/columns/Column";
import {PrimaryColumn} from "../../../../../../../src/decorator/columns/PrimaryColumn";
import {Index} from "../../../../../../../src/decorator/Index";
import {Category} from "./Category";
import {ManyToOne} from "../../../../../../../src/decorator/relations/ManyToOne";

@Entity()
@Index(["id", "authorId"])
export class Post {

    @PrimaryColumn()
    id: number;

    @PrimaryColumn()
    authorId: number;

    @Column()
    title: string;

    @Column()
    isRemoved: boolean = false;

    @ManyToOne(type => Category, category => category.posts)
    category: Category;

    @ManyToOne(type => Category)
    subcategory: Category;
    
    categoryId: number;

}