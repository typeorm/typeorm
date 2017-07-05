import {Column} from "../../../../../../src/decorator/columns/Column";
import {TableInheritance} from "../../../../../../src/decorator/entity/TableInheritance";
import {DiscriminatorColumn} from "../../../../../../src/decorator/columns/DiscriminatorColumn";
import {Entity} from "../../../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../../src/decorator/columns/PrimaryGeneratedColumn";

@Entity()
@TableInheritance("single-table")
@DiscriminatorColumn({ name: "type", type: "varchar" })
export class Person {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

}
