import { Entity, PrimaryColumn } from "../../../../../src"

@Entity()
export class Parent {
    @PrimaryColumn()
    firstId: number

    @PrimaryColumn()
    secondId: number
}
