import { Entity } from "../../../../../../src/decorator/entity/Entity"
import { PrimaryColumn } from "../../../../../../src/decorator/columns/PrimaryColumn"
import { Column } from "../../../../../../src/decorator/columns/Column"

@Entity()
export class Post {
    @PrimaryColumn()
    id: number

    @Column({ collation: "RTRIM" })
    name: string

    @Column({ collation: "NOCASE" })
    description: string

    @Column({ collation: "BINARY" })
    text: string

    @Column()
    nonCollated: string

    @Column({ default: "COLLATE NOCASE" })
    defaultContainsCollateKeyword: string

    @Column({
        type: "varchar",
        enum: ["COLLATE BINARY", "B", "C,D"],
        collation: "NOCASE",
        default: "COLLATE RTRIM",
    })
    enumCollated: string

    @Column({ name: "post", collation: "NOCASE" })
    nameAsTableName: string

    @Column({ name: "name,with,comma", collation: "RTRIM" })
    nameWithComma: string

    @Column({ name: "name.with.dot", collation: "NOCASE" })
    nameWithDot: string
}
