import { Entity, PrimaryGeneratedColumn } from "../../../../src"
import { Column } from "../../../../src/decorator/columns/Column"
import { Index } from "../../../../src/decorator/Index"

@Entity()
@Index(["name"], { fulltext: true })
@Index(["point"], { spatial: true })
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @Column("point")
    point: string

    @Column("polygon")
    polygon: string
}
