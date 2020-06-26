import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity({database: "secondDB", schema: "answers"})
export class Answer {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    text: string;

    @Column()
    questionId: number;

}
