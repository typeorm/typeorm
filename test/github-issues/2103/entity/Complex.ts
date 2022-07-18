import { Entity, Column, PrimaryColumn } from "typeorm"

@Entity()
export class Complex {
    @PrimaryColumn()
    id: number

    @PrimaryColumn()
    code: number

    @Column()
    x: number
}
