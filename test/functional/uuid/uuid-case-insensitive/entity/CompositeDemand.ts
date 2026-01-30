import { Entity, PrimaryColumn, Column } from "../../../../../src"

@Entity()
export class CompositeDemand {
    @PrimaryColumn("uuid")
    id: string

    @PrimaryColumn()
    code: string

    @Column()
    amount: number
}
