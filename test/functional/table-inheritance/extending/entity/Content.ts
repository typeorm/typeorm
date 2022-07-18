import { Column } from "typeorm/decorator/columns/Column"
import { Unit } from "./Unit"

export class Content extends Unit {
    @Column()
    name: string
}
