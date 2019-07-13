import {Entity, ManyToMany, PrimaryGeneratedColumn, Column} from "../../../../src";
import {JoinTable} from "../../../../src/decorator/relations/JoinTable";
import {Category} from "./Category";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: string;
    
    @Column()
    name: string;

    @ManyToMany(() => Category, category => category.posts)
    @JoinTable()
    categories: Category[];

}
