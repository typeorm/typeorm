import { Entity, PrimaryGeneratedColumn, Column } from "../../../../../src"

@Entity()
export class Company {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @Column({ nullable: true })
    description: string
}
