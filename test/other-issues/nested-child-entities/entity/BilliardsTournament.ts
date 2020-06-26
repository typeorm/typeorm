import { ChildEntity } from "@typeorm/core";

import { Tournament } from "./Tournament";

@ChildEntity() // Causes Error of duplicated column in generated sql
export class BilliardsTournament extends Tournament {
    constructor(billiardsTournament?: { name: string }) {
        super(billiardsTournament);
    }
}
