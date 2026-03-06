import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src"

@Entity({ strict: true })
export class StrictAny {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: "any", nullable: true })
    anyField: number | string | boolean | object | null

    @Column({ type: "any", nullable: true })
    anotherAnyField: any

    @Column({ type: "any" })
    yetAnotherAnyField: any
}
