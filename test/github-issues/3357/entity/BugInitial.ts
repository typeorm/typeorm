import { Entity, PrimaryGeneratedColumn, Column } from "../../../../src"

@Entity({ name: "bug" })
export class BugInitial {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ type: "varchar", length: 50 })
    example!: string
}
