import { Entity, PrimaryGeneratedColumn, Column } from "../../../../../src"

@Entity()
export class Event {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @Column({ nullable: true })
    description: string

    /**
     * Virtual property mapped via leftJoinAndMapOne/leftJoinAndMapMany.
     * Not a real column — populated by query builder.
     */
    myRespond: any

    myResponds: any[]
}
