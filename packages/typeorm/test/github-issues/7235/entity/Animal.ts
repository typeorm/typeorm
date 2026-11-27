import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src"

@Entity()
export class Animal {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: "varchar" })
    name: string
}
