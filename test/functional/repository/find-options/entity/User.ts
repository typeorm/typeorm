import {Entity} from "../../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../src/decorator/columns/Column";
import {ManyToMany} from "../../../../../src/decorator/relations/ManyToMany";
import {Category} from "./Category";
import {ManyToOne} from "../../../../../src/decorator/relations/ManyToOne";

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

}