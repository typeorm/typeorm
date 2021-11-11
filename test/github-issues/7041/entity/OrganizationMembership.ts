import { BaseEntity, Column, Entity, ManyToOne } from "../../../../src";
import { User } from "./User";
import { Organization } from "./Organization";

@Entity()
export class OrganizationMembership extends BaseEntity {
    @ManyToOne(() => User, (user) => user.membership, {
        primary: true,
    })
    user: User;

    @ManyToOne(() => Organization, (organization) => organization.membership, {
        primary: true,
    })
    organization: Organization;

    @Column()
    accessLevel: string;
}
