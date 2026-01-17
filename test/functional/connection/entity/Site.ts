import { Entity, Column, PrimaryGeneratedColumn } from "../../../../src"

@Entity()
export class Site {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string
}
