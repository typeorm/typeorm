import { Column, Entity } from "../../../../../src"
import { Extendable } from "./extendable"

@Entity()
export class Extending extends Extendable {
    @Column({ type: "decimal", scale: 2, precision: 4, unique: true })
    value: number
}
