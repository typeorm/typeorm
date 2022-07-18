import { Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm"
import { UserToOrganizationEntity } from "./UserToOrganizationEntity"

@Entity("organizations")
export class OrganizationEntity {
    @PrimaryGeneratedColumn()
    id?: number

    @OneToMany(
        (type) => UserToOrganizationEntity,
        (userToOrganization) => userToOrganization.organization,
    )
    users: UserToOrganizationEntity[]
}
