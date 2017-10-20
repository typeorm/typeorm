import {Column} from "../../../../src/decorator/columns/Column";
import {PrimaryGeneratedColumn} from "../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Entity} from "../../../../src/decorator/entity/Entity";
import {ManyToOne} from "../../../../src/decorator/relations/ManyToOne";
import {Parent} from "./Parent";
import {BaseEntity} from "../../../../src/repository/BaseEntity";

@Entity()
export class ChildWithPromise extends BaseEntity {
    @PrimaryGeneratedColumn()
    public id: number;

    @Column()
    public name: string;

    @ManyToOne(() => Parent, (parent: Parent) => parent.id)
    public parent: Promise<Parent>;
}
