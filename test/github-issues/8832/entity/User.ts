import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src"

@Entity()
export class User {
    @PrimaryGeneratedColumn("increment")
    id?: number

    /** can use a default but testing against mysql since they're shared drivers */
    @Column({ type: "uuid", precision: 16 })
    uuid: string

    @Column({ type: "inet4" })
    inet4: string

    @Column({ type: "inet6" })
    inet6: string

    /** testing generation */
    @Column({ type: "uuid", generated: "uuid" })
    anotherUuid?: string
}
