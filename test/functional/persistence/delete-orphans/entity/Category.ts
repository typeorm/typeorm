import {Entity} from "../../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Post} from "./Post";
import {OneToMany} from "../../../../../src/decorator/relations/OneToMany";

@Entity()
export class Category {

    @PrimaryGeneratedColumn()
    id: number;

    @OneToMany(type => Post, post => post.category, { 
        cascadeInsert: true,
        eager: true
    })
    posts: Post[];

}
