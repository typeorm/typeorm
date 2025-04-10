import { Entity, PrimaryColumn } from "../../../../src"

@Entity()
export class B {
    @PrimaryColumn()
    fooCode: string

    @PrimaryColumn()
    barId: number
}
