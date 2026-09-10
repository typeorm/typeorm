import { Entity } from "../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../../../../src/decorator/columns/Column"

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
