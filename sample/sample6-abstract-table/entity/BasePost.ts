import { Column, PrimaryGeneratedColumn } from "../../../src/index"

export class BasePost {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string
}
