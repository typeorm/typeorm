import { Column } from "../typeorm/decorator/columns/Column"
import { Entity } from "../typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../typeorm"

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
