import {Entity} from "../../../../src/decorator/entity/Entity";
import {TableInheritance} from "../../../../src/decorator/entity/TableInheritance";
import {DiscriminatorColumn} from "../../../../src/decorator/columns/DiscriminatorColumn";
import {PrimaryGeneratedColumn} from "../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../src/decorator/columns/Column";

@Entity()
@TableInheritance("class-table")
@DiscriminatorColumn({ name: "type", type: "varchar" })
export class Person {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

}