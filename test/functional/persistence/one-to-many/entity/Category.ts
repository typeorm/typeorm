import {Entity} from "../../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {ManyToOne} from "../../../../../src/decorator/relations/ManyToOne";
import {Post} from "./Post";
import {Column} from "../../../../../src/decorator/columns/Column";

@Entity()
export class Category {

    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(type => Post, post => post.categories)
    post: Post;
    
    @Column()
    name: string;

}