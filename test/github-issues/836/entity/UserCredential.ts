import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"
import { OneToOne } from "typeorm/decorator/relations/OneToOne"
import { JoinColumn } from "typeorm/decorator/relations/JoinColumn"
import { User } from "./User"
import { PrimaryColumn } from "typeorm"

@Entity()
export class UserCredential {
    @OneToOne(() => User, {
        cascade: true,
    })
    @JoinColumn({
        name: "id",
        referencedColumnName: "id",
    })
    user: User

    @PrimaryColumn()
    id: number

    @Column()
    password: string

    @Column()
    salt: string
}
