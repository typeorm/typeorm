import { Entity } from "../../../../src/decorator/entity/Entity"
import { Column } from "../../../../src/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "../../../../src/decorator/columns/PrimaryGeneratedColumn"

@Entity()
export class Product {
    @PrimaryGeneratedColumn()
    id: number
}

@Entity()
export class ProductWithOptional {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ nullable: true })
    name: string | null
}
