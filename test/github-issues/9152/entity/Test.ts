import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src"

export type ValueUnion = 1 | 2 | 3

@Entity()
export class Test {
    @PrimaryGeneratedColumn({ unsigned: true })
    id: number

    // TODO? should it handle properly the union type nowadays?
    @Column({type: "int4"})
    value: ValueUnion
}
