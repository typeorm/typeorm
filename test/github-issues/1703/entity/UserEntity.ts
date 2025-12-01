import { Entity, OneToMany, PrimaryGeneratedColumn } from "../../../../src"
import { UserToOrganizationEntity } from "./UserToOrganizationEntity"

@Entity("user")
export class UserEntity {
    @PrimaryGeneratedColumn()
    id?: number

    @OneToMany(
        () => UserToOrganizationEntity,
        (userToOrganization) => userToOrganization.user,
    )
    organizations: UserToOrganizationEntity[]
}
