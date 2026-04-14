import { Column } from "../../../../../../src/decorator/columns/Column"
import { ChildEntity } from "../../../../../../src/decorator/entity/ChildEntity"
import { OneToOne } from "../../../../../../src/decorator/relations/OneToOne"
import { JoinColumn } from "../../../../../../src/decorator/relations/JoinColumn"
import { Actor } from "./Actor"
import { License } from "./License"

@ChildEntity()
export class Organization extends Actor {
    @Column()
    industry: string

    @OneToOne(() => License, { eager: true })
    @JoinColumn()
    license: License
}
