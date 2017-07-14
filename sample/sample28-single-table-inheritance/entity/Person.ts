import {Column} from "../../../src/decorator/columns/Column";
import {TableInheritance} from "../../../src/decorator/entity/TableInheritance";
import {DiscriminatorColumn} from "../../../src/decorator/columns/DiscriminatorColumn";
import {Entity} from "../../../src/decorator/entity/Entity";
import {PrimaryColumn} from "../../../src/decorator/columns/PrimaryColumn";

// todo: some things left to do:
// * check how it works when is join (conditions are not added in the joins right now)

@Entity("sample28_person")
@TableInheritance("single-table")
@DiscriminatorColumn({ name: "type", type: "varchar" })
export abstract class Person {

    @PrimaryColumn("int")
    id: number;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

}