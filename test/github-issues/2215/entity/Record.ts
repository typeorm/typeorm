import {Entity, PrimaryGeneratedColumn} from "../../../../src";

@Entity()
export class Record {

    @PrimaryGeneratedColumn()
    id: number;

}
