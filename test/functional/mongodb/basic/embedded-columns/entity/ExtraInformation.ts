import { Column } from "typeorm/decorator/columns/Column"
import { EditHistory } from "./EditHistory"

export class ExtraInformation {
    @Column((type) => EditHistory)
    lastEdit: EditHistory
}
