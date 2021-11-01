import {Entity} from "../../../../../src/decorator/entity/Entity";
import {Column} from "../../../../../src/decorator/columns/Column";
import {ManyToOne} from "../../../../../src/decorator/relations/ManyToOne";
import {Category} from "./Category";
import {Author} from "./Author";
import {JoinColumn} from "../../../../../src/decorator/relations/JoinColumn";

@Entity()
export class Post {

    @ManyToOne(type => Category, category => category.posts, {
        primary: true
    })
    category: Category;

    @Column()
    title: string;

    @ManyToOne(()=>Author,(author)=>author.post)
    @JoinColumn()
    author: Author;
}
