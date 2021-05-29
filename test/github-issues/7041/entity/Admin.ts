import {
    BaseEntity,
    Column,
    Entity,
    JoinColumn,
    OneToOne,
} from "../../../../src";
import { User } from "./User";
import { Organization } from "./Organization";

@Entity()
export class Admin extends BaseEntity {
    @OneToOne(() => User, (user) => user.admin, { primary: true })
    @JoinColumn()
    user: User;

    @OneToOne(() => Organization, (org) => org.admin)
    @JoinColumn()
    organization: Organization;

    @Column()
    randomField: string;
}
