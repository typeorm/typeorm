import { Entity, PrimaryColumn } from "../../../../src"
import { Basics } from "./basics"

@Entity({ name: "servers" })
export class Servers extends Basics {
    @PrimaryColumn({ name: "uuid", length: 36, type: "varchar" })
    uuid: string
}
