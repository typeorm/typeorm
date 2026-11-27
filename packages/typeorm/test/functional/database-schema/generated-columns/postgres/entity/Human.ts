import { Column, Entity, PrimaryGeneratedColumn } from "../../../../../../src"

@Entity({ schema: "test_schema" })
export class Human {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    firstName: string

    @Column()
    lastName: string

    @Column({
        asExpression: `"firstName" || ' ' || "lastName"`,
        generatedType: "STORED",
    })
    name: string
}
