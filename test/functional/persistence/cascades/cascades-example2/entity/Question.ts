import { Column } from "typeorm"
import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Answer } from "./Answer"
import { OneToMany } from "typeorm/decorator/relations/OneToMany"

@Entity()
export class Question {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ default: "My question" })
    name: string

    @OneToMany((type) => Answer, (answer) => answer.question, {
        cascade: ["insert"],
    })
    answers: Answer[]
}
