import { Entity, PrimaryGeneratedColumn, Column } from "../../../../../src"

@Entity({ strict: true })
export class StrictAnyEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: "any" })
    payload: any
}
