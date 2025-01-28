import { Entity, PrimaryGeneratedColumn } from "../../../../src"

@Entity()
export class RelationNestedEntity {
    @PrimaryGeneratedColumn()
    id: number
}
