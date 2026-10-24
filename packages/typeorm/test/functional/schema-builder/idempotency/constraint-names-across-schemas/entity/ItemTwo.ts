import {
    Check,
    Column,
    Entity,
    PrimaryColumn,
    Unique,
} from "../../../../../../src"

@Entity({ name: "item", schema: "schema_two" })
@Unique("item_once", ["code", "tenant"])
@Check("item_code_not_empty", `"code" <> ''`)
export class ItemTwo {
    @PrimaryColumn()
    id: number

    @Column()
    code: string

    @Column()
    tenant: string
}
