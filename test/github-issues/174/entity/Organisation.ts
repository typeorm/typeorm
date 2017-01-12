import {Table} from "../../../../src/decorator/tables/Table";
import {PrimaryGeneratedColumn} from "../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../src/decorator/columns/Column";
import {Embedded} from "../../../../src/decorator/Embedded";
import {Contact} from "./Contact";

@Table()
export class Organisation {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Embedded(type => Contact)
    contact: Contact;

}