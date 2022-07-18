import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"
import { Entity } from "typeorm/decorator/entity/Entity"

@Entity()
export class AccessToken {
    @PrimaryColumn()
    access_token: string
}
