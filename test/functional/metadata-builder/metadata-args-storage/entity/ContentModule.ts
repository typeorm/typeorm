import { Column } from "typeorm/decorator/columns/Column"
import { Unit } from "./Unit"

export class ContentModule extends Unit {
    @Column()
    tag: string
}
