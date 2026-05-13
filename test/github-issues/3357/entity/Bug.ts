import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src"

@Entity()
export class Bug {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ length: 50 })
    example: string
}
