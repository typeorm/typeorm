import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"
import { Column } from "typeorm/decorator/columns/Column"

@Entity({ name: "POST" })
export class Post {
    @PrimaryColumn()
    id: number

    @Column({ nullable: true })
    title?: string

    @Column({ name: "named_column", nullable: true })
    namedColumn?: string
}
