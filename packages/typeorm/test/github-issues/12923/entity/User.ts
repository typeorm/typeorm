import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    VersionColumn,
} from "../../../../src"

@Entity("users")
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ unique: true, name: "external_id" })
    externalId: string

    @Column({ name: "first_name" })
    firstName: string

    @UpdateDateColumn()
    updatedAt: Date

    @VersionColumn()
    version: number
}
