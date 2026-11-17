import { Column, Entity, PrimaryGeneratedColumn } from "../../../../../../src"

@Entity()
export class Robot {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @Column()
    model: string

    @Column({
        asExpression: `"name" || '-' || "model"`,
        generatedType: "STORED",
    })
    storedFullName: string

    @Column({
        generatedType: "VIRTUAL",
        asExpression: `"name" || '---' || "model"`,
    })
    virtualFullName: string
}
