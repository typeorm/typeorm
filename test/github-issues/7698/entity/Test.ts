import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src"

@Entity()
export class Test {
    @PrimaryGeneratedColumn({ type: "int" })
    id: number

    @Column()
    firstName: string

    @Column()
    lastName: string

    @Column({
        generatedType: "STORED",
        // asExpression is needed here or generatedType above will be ignored
        asExpression: "concat(`firstName`,' ',`lastName`)",
    })
    name: string
}
