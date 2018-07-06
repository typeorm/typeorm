import {Entity} from "../../../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../../src/decorator/columns/Column";

@Entity()
export class Test {
    
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: "testDate1", type: "datetime"})
    testDate1: Date;

    @Column({ name: "testDate2", type: "datetime"})
    testDate2: Date;

}