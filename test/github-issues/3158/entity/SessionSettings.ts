import { Entity, JoinColumn, OneToOne, PrimaryColumn } from "@typeorm/core";
import { Session } from "./Session";

@Entity({
    name: "SessionSettings"
})
export class SessionSettings {

    @PrimaryColumn()
    sessionId: number;

    @OneToOne(type => Session, session => session.id)
    @JoinColumn({name: "sessionId", referencedColumnName: "id"})
    session?: Session;

}
