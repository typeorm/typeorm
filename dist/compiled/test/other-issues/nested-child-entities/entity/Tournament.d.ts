import { TournamentGraph } from "./TournamentGraph";
export declare abstract class Tournament {
    id: number;
    name: string;
    graph: TournamentGraph;
    constructor(tournament?: {
        name: string;
    });
}
