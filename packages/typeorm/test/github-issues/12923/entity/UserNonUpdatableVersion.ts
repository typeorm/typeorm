import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    VersionColumn,
    UpdateDateColumn,
} from "../../../../src"

@Entity("users_non_updatable_version")
export class UserNonUpdatableVersion {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ name: "external_id", unique: true })
    externalId: string

    @Column({ name: "first_name", nullable: true })
    firstName: string

    @VersionColumn({ update: false })
    version: number

    @UpdateDateColumn()
    updatedAt: Date
}
