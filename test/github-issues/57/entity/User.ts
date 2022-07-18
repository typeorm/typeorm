import { AccessToken } from "./AccessToken"
import { JoinColumn } from "typeorm/decorator/relations/JoinColumn"
import { OneToOne } from "typeorm/decorator/relations/OneToOne"
import { Column } from "typeorm/decorator/columns/Column"
import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"
import { Entity } from "typeorm/decorator/entity/Entity"
import { Generated } from "typeorm/decorator/Generated"

@Entity()
export class User {
    @PrimaryColumn()
    @Generated()
    primaryKey: number

    @Column()
    email: string

    @OneToOne((type) => AccessToken, (token) => token.user)
    @JoinColumn()
    access_token: AccessToken
}
