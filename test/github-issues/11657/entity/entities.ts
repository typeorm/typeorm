import { Entity, ManyToOne, PrimaryGeneratedColumn } from "../../../../src"

@Entity()
export class ThirdElement {
    @PrimaryGeneratedColumn()
    id: number
}

@Entity()
export class SecondElement {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(() => ThirdElement)
    third: ThirdElement
}
@Entity()
export class FirstElement {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(() => SecondElement, { eager: true })
    second: SecondElement
}
