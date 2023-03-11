import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src"

@Entity()
export class User {
    @PrimaryGeneratedColumn("increment")
    id?: number

    @Column({ type: "uuid", precision: 16 })
    uuid: string

    @Column({ type: "inet4" })
    inet4: string

    @Column({ type: "inet6" })
    inet6: string
}
