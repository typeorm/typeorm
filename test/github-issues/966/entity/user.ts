import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"

export class PersonalInfo {
    @Column()
    firstName: string

    @Column()
    lastName: string

    @Column()
    address: string
}

export class UserInfo extends PersonalInfo {
    @Column()
    userName: string
}

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column((type) => UserInfo)
    info: UserInfo
}
