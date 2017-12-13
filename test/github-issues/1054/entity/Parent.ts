import {Column} from "../../../../src/decorator/columns/Column";
import {PrimaryGeneratedColumn} from "../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Entity} from "../../../../src/decorator/entity/Entity";
import {OneToMany} from "../../../../src/decorator/relations/OneToMany";
import {Child} from "./Child";
import {BaseEntity} from "../../../../src/repository/BaseEntity";
import {ChildWithPromise} from "./ChildWithPromise";

@Entity()
export class Parent extends BaseEntity {
    @PrimaryGeneratedColumn()
    public id: number;

    @Column()
    public name: string;

    @OneToMany(() => Child, (child: Child) => child.parent)
    public children: Child[];

    @OneToMany(() => ChildWithPromise, (child: ChildWithPromise) => child.parent)
    public childrenWithPromise: Promise<ChildWithPromise[]>;
}
