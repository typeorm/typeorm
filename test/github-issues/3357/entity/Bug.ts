import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src"

@Entity()
export class Bug {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: "varchar", length: 50 })
    example: string

    @Column({ type: "varchar", length: 100 })
    description: string
}
