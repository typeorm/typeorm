import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column, Entity } from "typeorm"

@Entity()
export class ShortTableName {
    @PrimaryGeneratedColumn() // typeORM requires a pkey
    PrimaryGeneratedColumnIDBlahBlahBlahThisIsReallyLong: number

    @Column()
    Name: string

    @Column()
    Value: number
}
