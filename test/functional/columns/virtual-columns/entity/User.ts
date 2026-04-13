import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
    VirtualColumn,
} from "../../../../../src"

@Entity({ name: "users" })
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    firstName: string

    @Column()
    lastName: string

    @VirtualColumn({
        query: (alias) =>
            `CONCAT(${alias}."firstName", ' ', ${alias}."lastName")`,
    })
    fullName?: string
}
