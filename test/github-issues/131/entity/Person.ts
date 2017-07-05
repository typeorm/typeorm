import {Column} from "../../../../src/decorator/columns/Column";
import {TableInheritance} from "../../../../src/decorator/entity/TableInheritance";
import {DiscriminatorColumn} from "../../../../src/decorator/columns/DiscriminatorColumn";
import {Entity} from "../../../../src/decorator/entity/Entity";
import {PrimaryColumn} from "../../../../src/decorator/columns/PrimaryColumn";

@Entity()
@TableInheritance("single-table")
@DiscriminatorColumn({ name: "type", type: "varchar" })
export class Person {

    @PrimaryColumn("int")
    id: number;

    @Column()
    name: string;

}
