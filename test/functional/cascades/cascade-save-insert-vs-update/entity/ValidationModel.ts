import { PrimaryColumn, OneToMany, Entity } from "../../../../../src/index"
import { DataModel } from "./DataModel"

@Entity()
export class ValidationModel {
    @PrimaryColumn()
    validation: number

    @OneToMany(() => DataModel, (dataModel) => dataModel.validations)
    dataModel: DataModel[]
}
