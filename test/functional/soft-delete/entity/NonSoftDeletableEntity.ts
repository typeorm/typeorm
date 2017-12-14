import {Entity} from "../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../src/decorator/columns/Column";

@Entity()
export class NonSoftDeletableEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    col1: string;
}
