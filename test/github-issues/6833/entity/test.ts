import { Entity, PrimaryColumn } from "typeorm"

export class MyId {
    first: number
    second: number
}

@Entity({ name: "jsonb_key_tests" })
export class JSONBKeyTest {
    @PrimaryColumn("jsonb")
    id: MyId
}
