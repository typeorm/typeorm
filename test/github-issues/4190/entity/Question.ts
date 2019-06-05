import {Entity, PrimaryGeneratedColumn, ManyToMany, JoinTable} from "../../../../src";
import {Category} from "./Category";

@Entity()
export class Question {

    @PrimaryGeneratedColumn()
    id: number;

    @ManyToMany("Category")
    @JoinTable()
    categories: Category[];

}