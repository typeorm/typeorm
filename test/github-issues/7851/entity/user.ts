import { Entity, PrimaryColumn } from "../../../../src"

@Entity("User")
export class User {
    @PrimaryColumn({ type: "varbinary", length: 16 })
    id!: Buffer
}
