import {Column, Entity, PrimaryGeneratedColumn} from "../../../src/index";
import {Category} from "./Category";
import {Author} from "./Author";
import {ManyToMany} from "../../../src/decorator/relations/ManyToMany";
import {JoinTable} from "../../../src/decorator/relations/JoinTable";
import {ManyToOne} from "../../../src/decorator/relations/ManyToOne";

@Entity("sample23_post")
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    text: string;

    @ManyToMany(type => Category, {
        cascade: true
    })
    @JoinTable()
    categories: Category[];

    @ManyToOne(type => Author, { cascade: ["insert"] })
    author: Author|null;

}