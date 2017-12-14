import {Entity} from "../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../src/decorator/columns/Column";
import {SoftDeleteDateColumn} from "../../../../src/decorator/columns/SoftDeleteDateColumn";
import {ChildDeletableEntity} from "./ChildDeletableEntity";
import {OneToMany} from "../../../../src/decorator/relations/OneToMany";

@Entity()
export class DeletableEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    col1: string;

    @SoftDeleteDateColumn()
    deletedAt: Date;

    @OneToMany(type => ChildDeletableEntity, (e: ChildDeletableEntity) => e.parent, {eager: true})
    children: ChildDeletableEntity[];
}
