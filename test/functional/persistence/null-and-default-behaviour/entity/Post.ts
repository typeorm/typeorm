import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"
import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"

@Entity()
export class Post {
    @PrimaryColumn()
    id: number

    @Column({ type: String, default: "hello default value", nullable: true })
    title?: string | null
}
