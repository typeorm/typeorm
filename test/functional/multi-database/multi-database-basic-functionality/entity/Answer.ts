import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"

@Entity({ database: "filename-sqlite.attach.db" })
export class Answer {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    text: string
}
