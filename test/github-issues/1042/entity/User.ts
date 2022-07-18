import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Profile } from "./Profile"
import { Information } from "./Information"

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @Column()
    registeredAt: Date

    @Column("json")
    profile: Profile

    @Column((type) => Information)
    information: Information
}
