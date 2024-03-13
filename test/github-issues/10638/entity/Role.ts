import { User } from "./User";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "../../../../src";

@Entity()
export class Role {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @OneToMany(_type => User, user => user.roles, {
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    })
    users: User[]

    constructor(part: Partial<Role>) {
        Object.assign(this, part)
    }
}
