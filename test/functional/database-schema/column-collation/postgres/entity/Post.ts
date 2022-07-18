import { Entity } from "../typeorm/decorator/entity/Entity"
import { PrimaryColumn } from "../typeorm/decorator/columns/PrimaryColumn"
import { Column } from "../typeorm/decorator/columns/Column"

@Entity()
export class Post {
    @PrimaryColumn()
    id: number

    @Column({ collation: "en_US" })
    name: string
}
