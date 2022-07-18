import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Question } from "./Question"
import { ManyToOne } from "typeorm/decorator/relations/ManyToOne"

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne((type) => Question, {
        cascade: ["insert"],
        nullable: true,
    })
    question: Question
}
