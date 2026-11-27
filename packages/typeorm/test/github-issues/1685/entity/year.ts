import { PrimaryColumn, Entity, OneToMany } from "../../../../src"
import { Month } from "./month"

@Entity()
export class Year {
    @PrimaryColumn()
    public yearNo: number

    @OneToMany(() => Month, (month) => month.yearNo)
    public month: Month[]
}
