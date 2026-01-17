import { Column } from "../../../../../../src/decorator/columns/Column"
import { MongoBaseEntity } from "./MongoBaseEntity"

export abstract class MiddleEntity extends MongoBaseEntity {
    @Column({ length: 100 })
    description: string

    @Column()
    status: string
}
