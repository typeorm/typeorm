import {Connection} from "../../../src";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Day} from "./entity/Day";
import {Food} from "./entity/Food";
import {Meal} from "./entity/Meal";
import {expect} from "chai";

describe("github issues > #8324 Mongodb: When a document is updated, all embedded arrays must be mapped correctly", () => {

    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            enabledDrivers: ["mongodb"],
            entities: [Day],
            schemaCreate: false,
            dropSchema: true
        });
    });
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should update all embedded documents", () => Promise.all(connections.map(async connection => {
        const dayRepository = connection.getRepository(Day);

        const day = new Day();
        day.meals = [new Meal()];
        day.meals[0].mealId = "meal-id-before";
        day.meals[0].foods = [new Food()];
        day.meals[0].foods[0].productId = "product-id-before";

        await dayRepository.save(day);

        day.meals[0].mealId = "meal-id-after";
        day.meals[0].foods[0].productId = "product-id-after";

        await dayRepository.save(day);

        const [persisted] = await dayRepository.findByIds([day._id.toHexString()]);

        expect(persisted.meals.length).to.equal(1);
        expect(persisted.meals[0].mealId).to.equal("meal-id-after");
        expect(persisted.meals[0].foods.length).to.equal(1);
        expect(persisted.meals[0].foods[0].productId).to.equal("product-id-after");
    })));

});
