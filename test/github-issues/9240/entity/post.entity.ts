import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    category1: number

    @Column()
    category2: number

    constructor(cat1: number, cat2: number) {
        this.category1 = cat1
        this.category2 = cat2
    }
}
