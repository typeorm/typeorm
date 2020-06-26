import { Entity, ManyToOne, PrimaryGeneratedColumn } from "@typeorm/core";
import { Question } from "./Question";

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(type => Question, {
        cascade: ["insert"],
        nullable: true
    })
    question: Question;

}
