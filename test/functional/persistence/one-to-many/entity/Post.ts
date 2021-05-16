import {Category} from "./Category";
import {Entity} from "../../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {OneToMany} from "../../../../../src/decorator/relations/OneToMany";
import {Column} from "../../../../../src/decorator/columns/Column";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @OneToMany(type => Category, category => category.post)
    categories: Category[]|null;

    @Column({
        default: "supervalue"
    })
    title: string;

}