import {
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
} from "../../../../../../src"
import { ItemOne } from "./ItemOne"

@Entity({ name: "link", schema: "schema_one" })
export class LinkOne {
    @PrimaryColumn()
    id: number

    @ManyToOne(() => ItemOne)
    @JoinColumn([
        { name: "item_code", referencedColumnName: "code" },
        { name: "item_tenant", referencedColumnName: "tenant" },
    ])
    item: ItemOne
}
