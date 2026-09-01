import { Entity } from "../../../../../../src/decorator/entity/Entity"
import { Column } from "../../../../../../src/decorator/columns/Column"
import { MongoBaseEntity } from "./MongoBaseEntity"

@Entity()
export class Article extends MongoBaseEntity {
    @Column({ length: 200 })
    description: string

    @Column()
    title: string
}
