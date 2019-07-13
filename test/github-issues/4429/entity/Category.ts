import {Entity, PrimaryGeneratedColumn, Column} from "../../../../src";
import {ManyToMany} from "../../../../src/decorator/relations/ManyToMany";
import {Post} from "./Post";

@Entity()
export class Category {

    @PrimaryGeneratedColumn()
    id: number;

    @ManyToMany(() => Post, post => post.categories)
    posts: Post[];

    @Column()
    date: Date;
}
