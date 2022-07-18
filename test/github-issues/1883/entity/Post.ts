import { Entity, PrimaryGeneratedColumn } from "typeorm"
import { FruitEnum } from "../enum/FruitEnum"
import { Column } from "typeorm/decorator/columns/Column"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column("enum", { enum: FruitEnum, default: FruitEnum.Apple })
    fruit: FruitEnum
}
