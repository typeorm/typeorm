import { AfterLoad, Column, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity()
export class Category {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    loaded: boolean = false

    @AfterLoad()
    printMessage() {
        this.loaded = true
    }
}
