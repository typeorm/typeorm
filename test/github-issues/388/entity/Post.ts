import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"
import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"

@Entity()
export class Post {
    @PrimaryColumn({ name: "bla_id" })
    lala_id: string

    @Column()
    title: string

    @Column({ name: "my_index" })
    index: number
}
