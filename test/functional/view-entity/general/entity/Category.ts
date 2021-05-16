import {Entity} from "../../../../../src";
import {Column} from "../../../../../src";
import {PrimaryGeneratedColumn} from "../../../../../src";

@Entity()
export class Category {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

}
