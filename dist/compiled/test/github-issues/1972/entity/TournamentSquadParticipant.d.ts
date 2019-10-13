import { TournamentParticipant } from "./TournamentParticipant";
import { User } from "./User";
export declare class TournamentSquadParticipant extends TournamentParticipant {
    owner: User;
    users: User[];
    constructor(tournamentSquadParticipant?: {
        users: User[];
        owner: User;
    });
}
