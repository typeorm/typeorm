import { Column, Entity, PrimaryGeneratedColumn } from "../../../../../../src"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column()
    useTitle: boolean

    @Column()
    firstName: string

    @Column()
    lastName: string

    @Column({
        asExpression: `"firstName" || ' ' || "lastName"`,
        insert: false,
        update: false,
    })
    fullName: string

    @Column({
        asExpression: `"firstName" || "lastName"`,
        insert: false,
        update: false,
    })
    name: string
}
