import { Column } from "../../../../../../src/index"
import { Entity } from "../../../../../../src/index"
import { PrimaryGeneratedColumn } from "../../../../../../src"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column("enum", { enum: ["A", "B", "C"] })
    enum: string

    @Column("enum", { enum: ["A", "B", "C"], array: true })
    enumArray: string[]

    @Column("enum", {
        enum: ["A", "B", "C"],
        enumName: "enum_array",
        array: true,
    })
    enumArray2: string[]

    @Column("simple-enum", { enum: ["A", "B", "C"] })
    simpleEnum: string

    @Column()
    name: string
}
