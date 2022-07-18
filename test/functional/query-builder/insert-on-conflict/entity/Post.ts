import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"
import { Unique } from "typeorm/decorator/Unique"
import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"

@Entity()
@Unique(["date"])
export class Post {
    @PrimaryColumn()
    id: string

    @Column()
    title: string

    @Column()
    date: Date
}
