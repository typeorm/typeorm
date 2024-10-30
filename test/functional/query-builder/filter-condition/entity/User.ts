import {
    Column,
    DeleteDateColumn,
    Entity,
    JoinTable,
    ManyToMany,
    PrimaryGeneratedColumn,
} from "../../../../../src"

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column({
        rawFilterCondition(alias) {
            return `${alias} != true`
        },
    })
    isDeactivated: boolean

    @DeleteDateColumn()
    deletedAt: Date

    @ManyToMany(() => User)
    @JoinTable()
    friends: User[]
}
