import { ChildEntity } from "../../../../../../src/decorator/entity/ChildEntity"
import { Column } from "../../../../../../src/decorator/columns/Column"
import { ManyToOne } from "../../../../../../src/decorator/relations/ManyToOne"
import { OneToMany } from "../../../../../../src/decorator/relations/OneToMany"
import { Actor } from "./Actor"
import { Account } from "./Account"

@ChildEntity()
export class Space extends Actor {
    @Column({ default: 0 })
    level: number

    @ManyToOne(() => Account, (a) => a.spaces, {
        eager: false,
        onDelete: "CASCADE",
    })
    account: Account

    @ManyToOne(() => Space, (s) => s.subspaces, {
        eager: false,
        nullable: true,
        onDelete: "SET NULL",
    })
    parentSpace: Space

    @OneToMany(() => Space, (s) => s.parentSpace, {
        eager: false,
        cascade: true,
    })
    subspaces: Space[]
}
