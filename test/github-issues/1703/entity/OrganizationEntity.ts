import { Entity, OneToMany, PrimaryGeneratedColumn } from "../../../../src"
import { UserToOrganizationEntity } from "./UserToOrganizationEntity"

@Entity("organizations")
export class OrganizationEntity {
    @PrimaryGeneratedColumn()
    id?: number

    @OneToMany(
        () => UserToOrganizationEntity,
        (userToOrganization) => userToOrganization.organization,
    )
    users: UserToOrganizationEntity[]
}
