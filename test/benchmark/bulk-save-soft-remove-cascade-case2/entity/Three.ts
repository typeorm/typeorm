import { DeleteDateColumn, OneToOne } from "../../../../src"
import { Column } from "../../../../src/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Entity } from "../../../../src/decorator/entity/Entity"
import { One } from "./One"

@Entity()
export class Three {
    @PrimaryGeneratedColumn()
    id: number

    @OneToOne((type) => One)
    one: One

    @Column({ type: "text" })
    text: string

    @DeleteDateColumn()
    deleted_at: string
}
