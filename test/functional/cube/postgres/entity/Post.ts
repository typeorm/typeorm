import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column("cube", {
        nullable: true,
    })
    mainColor: number[]

    @Column("cube", {
        nullable: true,
        array: true,
    })
    colors: number[][]
}
