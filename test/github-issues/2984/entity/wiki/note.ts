import {Entity, PrimaryGeneratedColumn, TableInheritance} from "../../../../../src";

@Entity({name: "wikiNote"})
@TableInheritance({column: {type: "varchar", name: "type"}})
export class Note {

    @PrimaryGeneratedColumn()
    public id: number;

}
