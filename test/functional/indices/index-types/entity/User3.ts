import { Entity, PrimaryGeneratedColumn } from "../../../../../src";


@Entity()
export class User3 {
    @PrimaryGeneratedColumn()
    id: number
}
