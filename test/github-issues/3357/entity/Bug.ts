import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src"

@Entity("bug")
export class Bug {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ length: "50" })
    example: string
}
