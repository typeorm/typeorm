import { Entity, PrimaryColumn, Column } from "typeorm/index"

@Entity()
export class Plan {
    @PrimaryColumn()
    planId: number

    @Column()
    planName: string
}
