import { ChildEntity } from "../../../../src"
import { Region, RegionType } from "./Region"

@ChildEntity("province")
export class Province extends Region {
    readonly type: RegionType = "province"
}