import { Column } from "@typeorm/core";
import { EditHistory } from "./EditHistory";

export class ExtraInformation {

    @Column(type => EditHistory)
    lastEdit: EditHistory;

}
