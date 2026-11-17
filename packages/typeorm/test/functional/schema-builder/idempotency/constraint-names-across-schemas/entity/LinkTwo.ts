import {
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
} from "../../../../../../src"
import { ItemTwo } from "./ItemTwo"

@Entity({ name: "link", schema: "schema_two" })
export class LinkTwo {
    @PrimaryColumn()
    id: number

    @ManyToOne(() => ItemTwo)
    @JoinColumn([
        { name: "item_code", referencedColumnName: "code" },
        { name: "item_tenant", referencedColumnName: "tenant" },
    ])
    item: ItemTwo
}
