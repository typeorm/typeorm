import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"

@Entity()
export class PostDetails {
    @PrimaryColumn()
    keyword: string
}
