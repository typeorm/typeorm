import { Entity, PrimaryColumn } from "typeorm"

@Entity("UsersObject")
export class UsersObject {
    @PrimaryColumn({ type: "int" })
    id!: number
}
