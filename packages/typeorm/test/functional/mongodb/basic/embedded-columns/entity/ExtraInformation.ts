import { Column } from "../../../../../../src/decorator/columns/Column"
import { EditHistory } from "./EditHistory"

export class ExtraInformation {
    @Column(() => EditHistory)
    lastEdit: EditHistory
}
