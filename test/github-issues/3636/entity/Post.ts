import { Column } from "typeorm/decorator/columns/Column"
import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"
import { Entity } from "typeorm/decorator/entity/Entity"

@Entity()
export class Post {
    @PrimaryColumn()
    id: number

    @Column({
        type: "json",
    })
    data: any
}
