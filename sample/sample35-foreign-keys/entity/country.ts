import { Column, Entity, PrimaryColumn } from "../../../src"

@Entity("countries")
export class Country {
    @PrimaryColumn({ length: 2 })
    code: string

    @Column()
    name: string
}
