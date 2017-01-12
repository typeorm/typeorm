import {Column} from "../../../../src/decorator/columns/Column";
import {EmbeddableTable} from "../../../../src/decorator/tables/EmbeddableTable";

@EmbeddableTable()
export class Contact {

    @Column()
    name: string;

    @Column()
    email: string;

}