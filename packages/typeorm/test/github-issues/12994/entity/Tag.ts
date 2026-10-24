import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src"

@Entity()
export class Tag {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column({ type: "varchar", unique: true })
    name: string
}
