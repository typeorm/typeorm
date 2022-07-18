import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"

@Entity()
export class Category {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ unique: true })
    name: string
}
