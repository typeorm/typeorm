import { Entity } from "../../../../src/decorator/entity/Entity"
import { CreateDateColumn, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from "../../../../src/index"
import { Policy } from "./Policy"
import { Group } from "./Group"

@Entity()
export class PolicyGroup {
    @PrimaryColumn({
        name: 'fk_policy_id',
        type: 'integer',
        unsigned: true,
    })
    policyId: number;

    @ManyToOne(() => Policy, policy => policy.id, {
        eager: true,
        nullable: false,
    })
    @JoinColumn({ name: 'fk_policy_id' })
    policy: Policy;

    @PrimaryColumn({
        name: 'fk_group_id',
        type: 'integer',
        unsigned: true,
    })
    groupId: number;

    @ManyToOne(() => Group, group => group.id, {
        eager: true,
        nullable: false,
    })
    @JoinColumn({ name: 'fk_group_id', referencedColumnName: 'id' })
    group: Group;

    @CreateDateColumn({ type: 'datetime', name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
    updatedAt: Date;
}