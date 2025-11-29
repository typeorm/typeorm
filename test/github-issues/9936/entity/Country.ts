import { ChildEntity } from "../../../../src"
import { Region, RegionType } from "./Region"

@ChildEntity("country")
export class Country extends Region {
    readonly type: RegionType = "country"
}
