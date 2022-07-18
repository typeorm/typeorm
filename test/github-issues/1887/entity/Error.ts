import { Entity, PrimaryGeneratedColumn } from "typeorm"
import { Column } from "typeorm/decorator/columns/Column"

@Entity("Error")
export class Error {
    @PrimaryGeneratedColumn()
    id: number

    @Column("uniqueidentifier", { nullable: false })
    executionGuid: string

    @Column()
    errorNumber: number

    @Column()
    errorDescription: string

    @Column()
    errorDate: Date
}
