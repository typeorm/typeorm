import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src"

@Entity()
export class BadInet4 {
    @PrimaryGeneratedColumn("uuid")
    id?: string

    @Column({ type: "inet4", length: "36" })
    inet4: string
}
