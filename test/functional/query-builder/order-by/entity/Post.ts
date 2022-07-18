import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"

@Entity({
    orderBy: {
        myOrder: "DESC",
    },
})
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    myOrder: number

    @Column()
    num1: number = 1

    @Column()
    num2: number = 1
}
