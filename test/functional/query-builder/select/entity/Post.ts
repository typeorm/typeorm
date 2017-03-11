import {Entity} from "../../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../src/decorator/columns/Column";
import {VersionColumn} from "../../../../../src/decorator/columns/VersionColumn";
import {Category} from "./Category";
import {ManyToOne} from "../../../../../src/decorator/relations/ManyToOne";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    description: string;

    @Column()
    rating: number;

    @VersionColumn()
    version: string;

    @ManyToOne(type => Category)
    category: Category;

}