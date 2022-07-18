import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { One } from "./One"
import { ManyToOne } from "typeorm"

@Entity()
export class Two {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne((type) => One)
    one: One

    @Column({ type: "text" })
    aaaaa: string

    @Column({ type: "text" })
    bbbbb: string

    @Column({ type: "text" })
    ccccc: string

    @Column({ type: "text" })
    ddddd: string

    @Column({ type: "text" })
    eeeee: string

    @Column({ type: "text" })
    fffff: string

    @Column({ type: "text" })
    ggggg: string

    @Column({ type: "text" })
    hhhhh: string
}
