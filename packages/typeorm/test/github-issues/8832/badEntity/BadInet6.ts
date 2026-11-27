import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src"

@Entity()
export class BadInet6 {
    @PrimaryGeneratedColumn("uuid")
    id?: string

    @Column({ type: "inet6", length: "36" })
    inet6: string
}
