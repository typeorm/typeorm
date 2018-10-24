import {Entity, PrimaryGeneratedColumn, TableInheritance} from "../../../../../src";

@Entity({name: "issueNote"})
@TableInheritance({column: {type: "varchar", name: "type"}})
export class Note {

    @PrimaryGeneratedColumn()
    public id: number;

}
