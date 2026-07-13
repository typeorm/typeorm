import { Entity, PrimaryGeneratedColumn } from "../../../../src"

@Entity("issue_12671_categories")
export class Category {
    @PrimaryGeneratedColumn()
    id: number
}
