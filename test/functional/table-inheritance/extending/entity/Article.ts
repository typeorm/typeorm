import { Entity } from "../../../../../src/decorator/entity/Entity"
import { Column } from "../../../../../src/decorator/columns/Column"
import { AbstractBase } from "./AbstractBase"

@Entity()
export class Article extends AbstractBase {
    @Column({ unique: true, nullable: false })
    title: string
}
