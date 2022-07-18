import { Entity, PrimaryGeneratedColumn } from "typeorm"
import { Column } from "typeorm/decorator/columns/Column"
import { Index } from "typeorm/decorator/Index"

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
