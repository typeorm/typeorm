import {Category} from "./Category";
import {Entity} from "../../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../src/decorator/columns/Column";
import {ManyToMany} from "../../../../../src/decorator/relations/ManyToMany";
import {JoinTable} from "../../../../../src/decorator/relations/JoinTable";
import {Embedded} from "../../../../../src/decorator/Embedded";
import {Counters} from "./Counters";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    description: string;

    @Embedded(type => Counters)
    counters: Counters;

    @ManyToMany(type => Category, category => category.posts, {
        cascadeUpdate: true
    })
    @JoinTable()
    categories: Category[];

}