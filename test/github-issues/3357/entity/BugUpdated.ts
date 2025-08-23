import { Entity, PrimaryGeneratedColumn, Column } from "../../../../src"

@Entity({ name: "bug" })
export class BugUpdated {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ type: "varchar", length: 51 })
    example!: string
}
