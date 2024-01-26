import { Entity } from "../../../../src/decorator/entity/Entity"
import { JoinColumn, ManyToOne, PrimaryColumn } from "../../../../src/index"
import { Policy } from "./Policy"
import { Group } from "./Group"

@Entity()
export class PolicyGroup {
    @PrimaryColumn({
        name: "fk_policy_id",
    })
    policyId: number

    @ManyToOne(() => Policy, (policy) => policy.id, {
        eager: true,
        nullable: false,
    })
    @JoinColumn({ name: "fk_policy_id" })
    policy: Policy

    @PrimaryColumn({
        name: "fk_group_id",
    })
    groupId: number

    @ManyToOne(() => Group, (group) => group.id, {
        eager: true,
        nullable: false,
    })
    @JoinColumn({ name: "fk_group_id" })
    group: Group
}
