import { ChildEntity, JoinColumn, OneToOne } from "@typeorm/core";
import { TournamentParticipant } from "./TournamentParticipant";
import { User } from "./User";

@ChildEntity()
export class TournamentUserParticipant extends TournamentParticipant {
    @OneToOne(type => User, {
        eager: true,
    })
    @JoinColumn()
    public user: User;

    constructor(tournamentUserParticipant?: { user: User }) {
        super();

        if (tournamentUserParticipant) {
            this.user = tournamentUserParticipant.user;
        }
    }

}
