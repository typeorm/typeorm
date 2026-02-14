import { Column, Entity, PrimaryGeneratedColumn } from "../../../../../src"
import { Department } from "./Department"

@Entity()
export class Parent {
    @PrimaryGeneratedColumn()
    id: number

    @Column(() => Department)
    department: Department
}
