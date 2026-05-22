import { Column, Entity, PrimaryGeneratedColumn } from "../../../../../src"

@Entity()
export class Item {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: "jsonb" })
    input: { id: string; value: string }[]

    @Column({ type: "jsonb", nullable: true })
    numbers: number[] | null
}
