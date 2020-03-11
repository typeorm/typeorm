import {Entity} from "../../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../src/decorator/columns/Column";
import {DeleteDateColumn} from "../../../../../src/decorator/columns/DeleteDateColumn";

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number;

    @DeleteDateColumn()
    deletedAt: Date;

    @Column()
    name: string;
}