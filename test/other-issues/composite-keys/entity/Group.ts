import { OneToMany, PrimaryColumn } from "../../../../src"
import { Entity } from "../../../../src/decorator/entity/Entity"
import { PolicyGroup } from "./PolicyGroup"

@Entity()
export class Group {
    @PrimaryColumn({
        type: 'integer',
        unsigned: true,
    })
    id: number

    @OneToMany(() => PolicyGroup, (policyGroup) => policyGroup.policy, {
        eager: false,
    })
    groups: PolicyGroup[]

    @OneToMany(() => PolicyGroup, (policyGroup) => policyGroup.group, {
        eager: false,
    })
    policies: PolicyGroup[]
}
