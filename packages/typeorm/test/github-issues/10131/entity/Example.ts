import { Entity, PrimaryGeneratedColumn, Column } from "../../../../src"

@Entity()
export class Example {
    @PrimaryGeneratedColumn("uuid")
    id?: string

    @Column("varchar", { length: 10 })
    varCharField: string = ""

    @Column("char", { length: 10 })
    charField: string = ""
}
