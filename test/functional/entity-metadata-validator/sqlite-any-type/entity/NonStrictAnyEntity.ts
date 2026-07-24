import { Entity, PrimaryGeneratedColumn, Column } from "../../../../../src"

@Entity()
export class NonStrictAnyEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: "any" })
    payload: any
}
