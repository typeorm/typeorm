import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {expect} from "chai";
import {Artikel} from "./entity/Artikel";
import {Kollektion} from "./entity/Kollektion";

describe("github issues > #71 ManyToOne relation with custom column name persistence fails", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should persist successfully entity successfully with its many-to-one relation", () => Promise.all(connections.map(async connection => {

        const kollektion = new Kollektion();
        kollektion.name = "kollektion #1";

        const artikel = new Artikel();
        artikel.name = "artikel #1";
        artikel.nummer = "1";
        artikel.extrabarcode = "123456789";
        artikel.saison = "------";
        artikel.kollektion = kollektion;

        await connection.manager.save(artikel);

        const loadedArtikel = await connection.manager
            .createQueryBuilder(Artikel, "artikel")
            .innerJoinAndSelect("artikel.kollektion", "kollektion")
            .where("artikel.id=:id", { id: 1 })
            .getOne();

        expect(kollektion).not.to.be.empty;
        expect(loadedArtikel).not.to.be.empty;
        loadedArtikel!.should.be.eql({
            id: 1,
            nummer: "1",
            name: "artikel #1",
            extrabarcode: "123456789",
            saison: "------",
            kollektion: {
                id: 1,
                name: "kollektion #1"
            }
        });
    })));

});
