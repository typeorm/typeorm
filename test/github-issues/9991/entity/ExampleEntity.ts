import { Entity } from "../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../src/decorator/columns/PrimaryGeneratedColumn"

@Entity({ name: "example", comment: "this is table comment" })
export class ExampleEntity {
    @PrimaryGeneratedColumn()
    id: number
}
