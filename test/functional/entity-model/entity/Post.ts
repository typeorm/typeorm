import {Entity} from "../../../../src/decorator/entity/Entity";
import {BaseEntity} from "../../../../src/repository/BaseEntity";
import {PrimaryGeneratedColumn} from "../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../src/decorator/columns/Column";
import {ManyToMany, JoinTable} from "../../../../src";
import {Category} from "./Category";

@Entity()
export class Post extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column({
        default: "This is default text."
    })
    text: string;

    @ManyToMany(type => Category)
    @JoinTable()
    categories: Category[];

}