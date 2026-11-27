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

    // Extra column needed so the table is not identity-only —
    // SAP HANA cannot insert into tables whose only column is GENERATED ALWAYS AS IDENTITY
    @Column({ nullable: true })
    name: string

    @OneToMany(() => DataModel, (dataModel) => dataModel.main, {
        cascade: true,
        eager: true,
    })
    dataModel: DataModel[]
}
