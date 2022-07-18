import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"
import { Column } from "typeorm/decorator/columns/Column"

@Entity()
export class Post {
    @PrimaryColumn("int")
    id: number

    @Column()
    dateTimeColumn: Date
}
