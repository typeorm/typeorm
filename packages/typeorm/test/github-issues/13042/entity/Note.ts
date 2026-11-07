import { Column, Entity, PrimaryColumn } from "../../../../src"

@Entity()
export class Note {
    @PrimaryColumn()
    id: number

    @Column({ type: "varchar", length: 50, default: "won't fix" })
    status: string
}
