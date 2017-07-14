import {PrimaryGeneratedColumn, Column, Entity} from "../../../src/index";
import {Counters} from "./Counters";
import {Embedded} from "../../../src/decorator/Embedded";

@Entity("sample26_question")
export class Question {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column(type => Counters)
    counters: Counters;
    
}