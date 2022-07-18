import { Entity, Column, PrimaryGeneratedColumn } from "typeorm"

@Entity()
export class Simple {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    x: number
}
