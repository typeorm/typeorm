import { Entity } from "../../../../../../src/decorator/entity/Entity"
import { PrimaryColumn } from "../../../../../../src/decorator/columns/PrimaryColumn"
import { Column } from "../../../../../../src/decorator/columns/Column"

@Entity()
export class Post {
    @PrimaryColumn()
    id: number

    @Column({ collation: "ascii_general_ci" })
    name: string

    @Column({ charset: "utf8mb4" })
    title: string

    @Column({ charset: "cp852", collation: "cp852_general_ci" })
    description: string
}
