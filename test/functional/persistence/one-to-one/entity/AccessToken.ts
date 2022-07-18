import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"
import { Entity } from "typeorm/decorator/entity/Entity"
import { JoinColumn } from "typeorm/decorator/relations/JoinColumn"
import { OneToOne } from "typeorm/decorator/relations/OneToOne"
import { User } from "./User"
import { Generated } from "typeorm/decorator/Generated"

@Entity()
export class AccessToken {
    @PrimaryColumn()
    @Generated()
    primaryKey: number

    @OneToOne((type) => User, (user) => user.access_token)
    @JoinColumn()
    user: User
}
