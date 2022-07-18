import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity()
export class Personalization {
    @PrimaryGeneratedColumn("uuid") public id: number

    @Column() public logo: string
}
