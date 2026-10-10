import { Column, Entity, PrimaryGeneratedColumn } from "../../../../../src"

@Entity("all_generated_entity")
export class AllGeneratedEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column({
        type: "int",
        generatedType: "STORED",
        asExpression: "1 + 1",
    })
    generated: number
}
