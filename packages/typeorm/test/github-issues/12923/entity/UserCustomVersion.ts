import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    VersionColumn,
} from "../../../../src"

@Entity("users_custom_version")
export class UserCustomVersion {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ unique: true, name: "external_id" })
    externalId: string

    @Column({ name: "first_name" })
    firstName: string

    @UpdateDateColumn()
    updatedAt: Date

    @VersionColumn({ name: "v_count" })
    customVersion: number
}
