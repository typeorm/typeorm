import { Entity, PrimaryGeneratedColumn } from "typeorm/index"

@Entity()
export class Category {
    @PrimaryGeneratedColumn()
    id: number
}
