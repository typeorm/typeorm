import {PrimaryColumn} from "../../../../src/decorator/columns/PrimaryColumn";
import {Entity} from "../../../../src/decorator/entity/Entity";
import {Column} from "../../../../src/decorator/columns/Column";
import {OneToOne} from "../../../../src/decorator/relations/OneToOne";
import {Person} from "./Person";

@Entity()
export class Passport {

    @PrimaryColumn()
    id: number;

    @Column()
    passportNumber: string;
    
    @OneToOne(type => Person, person => person.passport)
    owner: Person;
}
