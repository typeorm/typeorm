import { Column, Entity } from "typeorm"

@Entity()
export class Product {
    @Column({ primary: true })
    id: number

    @Column()
    name: string
}
