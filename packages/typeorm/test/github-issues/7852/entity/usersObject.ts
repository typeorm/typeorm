import { Entity, PrimaryColumn } from "../../../../src"

@Entity("UsersObject")
export class UsersObject {
    @PrimaryColumn({ type: "int" })
    id!: number
}
