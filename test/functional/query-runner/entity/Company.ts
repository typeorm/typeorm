import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src"

@Entity()
export class Company {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string
}
