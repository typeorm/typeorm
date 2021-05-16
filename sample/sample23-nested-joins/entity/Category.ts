import {Column, Entity, PrimaryGeneratedColumn} from "../../../src/index";
import {Author} from "./Author";
import {ManyToMany} from "../../../src/decorator/relations/ManyToMany";
import {JoinTable} from "../../../src/decorator/relations/JoinTable";

@Entity("sample23_category")
export class Category {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;
    
    @ManyToMany(type => Author)
    @JoinTable()
    author: Author;

}