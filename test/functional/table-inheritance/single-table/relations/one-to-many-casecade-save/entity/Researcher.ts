import { ChildEntity } from "../../typeorm/decorator/entity/ChildEntity"
import { Staff } from "./Staff"
import { Column } from "../../typeorm"

@ChildEntity("RESEARCHER")
export class Researcher extends Staff {
    constructor(areaOfStudy: string) {
        super()
        this.areaOfStudy = areaOfStudy
    }

    @Column()
    areaOfStudy: string
}
