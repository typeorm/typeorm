import { Column, Entity, PrimaryGeneratedColumn } from "../../../../../../src"

@Entity()
export class Audit {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column("jsonb")
    data: any
}
