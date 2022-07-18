import { Column, OneToMany, Entity } from "typeorm/index"
import { DataModel } from "./DataModel"

@Entity()
export class ValidationModel {
    @Column({
        type: "integer",
        primary: true,
    })
    validation: number

    @OneToMany((type) => DataModel, (dataModel) => dataModel.validations)
    dataModel: DataModel[]
}
