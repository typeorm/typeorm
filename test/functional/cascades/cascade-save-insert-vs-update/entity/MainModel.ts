import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
    OneToMany,
} from "../../../../../src/index"
import { DataModel } from "./DataModel"

@Entity()
export class MainModel {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ default: "" })
    name: string

    @OneToMany(() => DataModel, (dataModel) => dataModel.main, {
        cascade: true,
        eager: true,
    })
    dataModel: DataModel[]
}
