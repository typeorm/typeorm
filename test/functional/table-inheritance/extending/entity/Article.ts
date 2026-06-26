import { Entity } from "../../../../../src/decorator/entity/Entity"
import { Column } from "../../../../../src/decorator/columns/Column"
import { AbstractBase } from "./AbstractBase"

@Entity()
export class Article extends AbstractBase {
    @Column({ type: String, unique: true, nullable: false })
    title: string | null
}
