import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    firstName: string

    @Column()
    lastName: string

    @Column({ asExpression: "concat(`firstName`,' ',`lastName`)" })
    virtualFullName: string

    @Column({
        asExpression: "concat(`firstName`,' ',`lastName`)",
        generatedType: "STORED",
    })
    storedFullName: string
}
