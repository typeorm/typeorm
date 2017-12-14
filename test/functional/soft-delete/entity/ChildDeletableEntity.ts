import {Entity} from "../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../src/decorator/columns/Column";
import {SoftDeleteDateColumn} from "../../../../src/decorator/columns/SoftDeleteDateColumn";
import {ManyToOne} from "../../../../src/decorator/relations/ManyToOne";
import {DeletableEntity} from "./DeletableEntity";

@Entity()
export class ChildDeletableEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    col1: string;

    @SoftDeleteDateColumn()
    deletedAt: Date;

    @ManyToOne(type => DeletableEntity, (e: DeletableEntity) => e.children)
    parent: DeletableEntity;

}
