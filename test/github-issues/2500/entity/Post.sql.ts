import {Entity} from "../../../../src/decorator/entity/Entity";
import {Column} from "../../../../src/decorator/columns/Column";
import {BaseEntity} from "../../../../src/repository/BaseEntity";
import {PrimaryGeneratedColumn} from "../../../../src/decorator/columns/PrimaryGeneratedColumn";

@Entity()
export class SqlPost extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    author: string;
}
