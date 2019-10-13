import { TournamentParticipant } from "./TournamentParticipant";
import { User } from "./User";
export declare class TournamentUserParticipant extends TournamentParticipant {
    user: User;
    constructor(tournamentUserParticipant?: {
        user: User;
    });
}
