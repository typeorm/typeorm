import { Column, Entity, ObjectIdColumn } from "../../../../../../src"

@Entity()
export class TransactionDocument {
    @ObjectIdColumn()
    id: unknown

    @Column()
    name: string
}
