import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"
import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"

import { Gender } from "./GenderEnum"

@Entity()
export class Animal {
    @PrimaryColumn()
    id: number

    @Column()
    name: string

    @Column({
        type: "enum",
        enum: Gender,
        enumName: "genderEnum",
    })
    gender: Gender

    @Column()
    specie: string
}
