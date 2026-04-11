import { Column, Entity, PrimaryColumn } from "../../../../../src"

@Entity("users")
export class User {
    @PrimaryColumn({ name: "ref" })
    id: number

    @Column("uuid", { unique: true })
    uuid: string
}
