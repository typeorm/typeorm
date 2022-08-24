import { Column } from "../../../../../../src/decorator/columns/Column"
import { EditHistory } from "./EditHistory"

export class ExtraInformation {
    @Column((type) => EditHistory)
    lastEdit: EditHistory
}
