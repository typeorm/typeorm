import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"

@Entity("Tags")
export class Tag {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    a: string

    @Column()
    b: string

    @Column()
    c: string
}
