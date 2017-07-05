import {Column} from "../../../src/decorator/columns/Column";
import {TableInheritance} from "../../../src/decorator/entity/TableInheritance";
import {DiscriminatorColumn} from "../../../src/decorator/columns/DiscriminatorColumn";
import {Entity} from "../../../src/decorator/entity/Entity";
import {PrimaryColumn} from "../../../src/decorator/columns/PrimaryColumn";

@Entity("sample29_person")
@TableInheritance("class-table")
@DiscriminatorColumn({ name: "type", type: "varchar" })
export abstract class Person {

    @PrimaryColumn("int"/*, { generated: true }*/)
    id: number;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

}