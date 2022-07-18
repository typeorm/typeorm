import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"
import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"

@Entity({ synchronize: false })
export class Album {
    @PrimaryColumn()
    id: number

    @Column()
    name: string
}
