import { Entity } from "../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../src/decorator/columns/PrimaryGeneratedColumn"

@Entity({ autoIncrementStartFrom: 50 })
export class ExampleEntity {
    @PrimaryGeneratedColumn()
    id: number
}
