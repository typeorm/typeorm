import { Column, Index, PrimaryGeneratedColumn } from "../../../../src"
import { Entity } from "../../../../src/decorator/entity/Entity"

@Entity()
export class User {
    @PrimaryGeneratedColumn('uuid')
    @Index({type: 'hash'})
    id: string

    @Column()
    @Index()
    name: string
}
