import {Column} from "../../../../src/decorator/columns/Column";
import {SoftDeleteDateColumn} from "../../../../src/decorator/columns/SoftDeleteDateColumn";
import {PrimaryGeneratedColumn} from "../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Entity} from "../../../../src/decorator/entity/Entity";

@Entity()
export class Test {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    col1: string;

    @SoftDeleteDateColumn()
    deletedAt: Date;

}
