import { Entity } from "../typeorm/decorator/entity/Entity"
import { PrimaryColumn } from "../typeorm/decorator/columns/PrimaryColumn"
import { Column } from "../typeorm/decorator/columns/Column"

@Entity()
export class Post {
    @PrimaryColumn()
    id: number

    @Column({ collation: "ascii_general_ci" })
    name: string

    @Column({ charset: "utf8" })
    title: string

    @Column({ charset: "cp852", collation: "cp852_general_ci" })
    description: string
}
