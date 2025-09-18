import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src"

@Entity()
export class RelationNestedEntity {
    @PrimaryGeneratedColumn()
    id: number

    // a dummy field to prevent SAP failure on rows without non-generated values
    @Column()
    dummyColumn: number = 0
}
