import { Entity, PrimaryColumn } from "../../../../src"

@Entity({ name: "customers" })
export class Customer {
    @PrimaryColumn("uuid")
    id: string
}
