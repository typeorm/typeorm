import { Column, PrimaryGeneratedColumn } from "../../../../src"
import { Entity } from "../../../../src/decorator/entity/Entity"

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column("int", {
        array: true,
        default: "{}",
    })
    roles: number[]

    @Column("date", {
        array: true,
        default: "{}",
    })
    dates: Date[]
}
