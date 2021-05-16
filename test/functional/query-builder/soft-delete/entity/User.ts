import {Entity} from "../../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {DeleteDateColumn} from "../../../../../src/decorator/columns/DeleteDateColumn";
import {Column} from "../../../../../src/decorator/columns/Column";

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    likesCount: number = 0;

    @DeleteDateColumn()
    deletedAt: Date;

}