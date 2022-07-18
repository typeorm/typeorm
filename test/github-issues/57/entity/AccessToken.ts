import { Generated } from "typeorm"
import { Column } from "typeorm/decorator/columns/Column"
import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"
import { Entity } from "typeorm/decorator/entity/Entity"
import { OneToOne } from "typeorm/decorator/relations/OneToOne"
import { User } from "./User"

@Entity()
export class AccessToken {
    @PrimaryColumn()
    @Generated()
    primaryKey: number

    @Column()
    expireTime: number

    @OneToOne((type) => User, (user) => user.access_token, {
        cascade: true,
    })
    user: User
}
