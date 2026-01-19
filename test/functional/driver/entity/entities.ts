import {
    Column,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "../../../../src"

@Entity("third_element")
export class ThirdElement {
    @PrimaryGeneratedColumn()
    id: number
    // a dummy field to prevent SAP failure on rows without non-generated values
    @Column()
    dummyColumn: number = 0
}

@Entity("second_element")
export class SecondElement {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(() => ThirdElement)
    third: ThirdElement
    // a dummy field to prevent SAP failure on rows without non-generated values
    @Column()
    dummyColumn: number = 0
}
@Entity("first_element")
export class FirstElement {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(() => SecondElement, { eager: true })
    second: SecondElement
    // a dummy field to prevent SAP failure on rows without non-generated values
    @Column()
    dummyColumn: number = 0
}
