import { Entity } from "typeorm/decorator/entity/Entity"
import {
    ManyToOne,
    Column,
    DeleteDateColumn,
    PrimaryGeneratedColumn,
} from "typeorm"
import { Role } from "./Role"

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @ManyToOne((_) => Role, (role) => role.users)
    role: Role

    @DeleteDateColumn()
    deleteAt?: Date
}
