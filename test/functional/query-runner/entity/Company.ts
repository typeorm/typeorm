import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src"

@Entity({ comment: "This is a company entity" })
export class Company {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string
}
