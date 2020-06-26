import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "@typeorm/core";
import { Answer } from "./Answer";

@Entity()
export class Question {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({default: "My question"})
    name: string;

    @OneToMany(type => Answer, answer => answer.question, {cascade: ["insert"]})
    answers: Answer[];

}
