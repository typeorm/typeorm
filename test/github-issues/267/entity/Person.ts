import {Entity} from "../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../src/decorator/columns/Column";

@Entity()
export class Person {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column({type: "datetime", localTimezone: true})
    birthday: string;

    @Column({type: "datetime", length: "1", localTimezone: true})
    aTime: string;

    @Column({type: "datetime", length: "2", localTimezone: true})
    bTime: string;

    @Column({type: "datetime", length: "3", localTimezone: true})
    cTime: string;

    @Column({type: "datetime", length: "4", localTimezone: true})
    dTime: string;

    @Column({type: "datetime", length: "5", localTimezone: true})
    eTime: string;

    @Column({type: "datetime", length: "6", localTimezone: true})
    fTime: string;
}