import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
} from "../../../../src"

@Entity()
export class Example {
    @PrimaryGeneratedColumn("uuid")
    id?: string

    @CreateDateColumn({ type: "datetime" })
    created?: Date

    @Column("varchar", { length: 10 })
    content: string = ""

    @Column("char", { length: 10 })
    fixedLengthContent: string = ""
}
