import { ChildEntity } from "../../../../src"
import { Region, RegionType } from "./Region"

@ChildEntity()
export class Province extends Region {
    readonly type: RegionType = "province"
}