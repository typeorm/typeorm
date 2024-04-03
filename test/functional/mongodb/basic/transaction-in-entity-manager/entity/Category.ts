import { Column, Entity, ObjectIdColumn } from "../../../../../../src"

@Entity()
export class Category {
    @ObjectIdColumn()
    id: number

    @Column()
    name: string
}
