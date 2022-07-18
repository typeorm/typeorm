import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"
import { Entity } from "typeorm/decorator/entity/Entity"

@Entity()
export class Post {
    @PrimaryColumn()
    id: number

    constructor(id: number) {
        this.id = id
    }
}
