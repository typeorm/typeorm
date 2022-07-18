import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"

@Entity({ database: "secondDB", schema: "answers" })
export class Answer {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    text: string

    @Column()
    questionId: number
}
