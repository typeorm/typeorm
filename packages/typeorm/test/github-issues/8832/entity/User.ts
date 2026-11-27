import {
    Column,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
} from "../../../../src"
import { Address } from "./Address"

@Entity()
export class User {
    @PrimaryGeneratedColumn("uuid")
    id?: string

    /** can use a default but testing against mysql since they're shared drivers */
    @Column({ type: "uuid" })
    uuid: string

    @Column({ type: "inet4" })
    inet4: string

    @Column({ type: "inet6" })
    inet6: string

    /** testing generation */
    @Column({ type: "uuid", generated: "uuid" })
    another_uuid_field?: string

    @OneToMany(() => Address, (address) => address.user)
    addresses?: Address[]
}
