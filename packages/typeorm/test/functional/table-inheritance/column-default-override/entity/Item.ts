import { Column, Entity, PrimaryGeneratedColumn } from "../../../../../src"

export abstract class Item {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ default: "unnamed" })
    name: string
}

// declared (and so built) before Category, which does not override the column
@Entity()
export class Product extends Item {
    @Column({ default: "new product" })
    name: string
}

@Entity()
export class Category extends Item {}
