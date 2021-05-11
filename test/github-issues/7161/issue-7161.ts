//import "reflect-metadata";
import { Connection } from "../../../src/connection/Connection";
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils";
import { Order, Product, User } from "./entity/entities";

describe("github issues > #7161 Add support for non-distinct count in getCount()", () => {
    let connections: Connection[];
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: true,
                dropSchema: true,
                logging: true,
            }))
    );
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    const createData = async (connection: Connection) => {
        const userA = new User({ id: 1, name: "A" });
        const userB = new User({ id: 2, name: "B" });
        const userC = new User({ id: 3, name: "C" });
        const users = [userA, userB, userC];

        const userRepository = connection.getRepository(User);
        await userRepository.save(userA);
        await userRepository.save(userB);
        await userRepository.save(userC);

        const productRepository = connection.getRepository(Product);
        const p1 = await productRepository.save(
            new Product({ id: 1, name: "Product 1" })
        );
        const p2 = await productRepository.save(
            new Product({ id: 2, name: "Product 2" })
        );
        const p3 = await productRepository.save(
            new Product({ id: 3, name: "Product 3" })
        );

        const now = new Date();
        const orderRepository = connection.getRepository(Order);
        await orderRepository.save(
            new Order({
                id: 1,
                date: now,
                user: userA,
                products: [p1, p2, p3],
            })
        );
        await orderRepository.save(
            new Order({
                id: 2,
                date: now,
                user: userA,
                products: [p1],
            })
        );
        await orderRepository.save(
            new Order({
                id: 3,
                date: now,
                user: userB,
                products: [p1, p3],
            })
        );
        await orderRepository.save(
            new Order({
                id: 4,
                date: now,
                user: userB,
                products: [p1, p2],
            })
        );
        await orderRepository.save(
            new Order({
                id: 5,
                date: now,
                user: userC,
                products: [p1, p2],
            })
        );
        return users;
    };

    it("Repository.count()", () =>
        Promise.all(
            connections.map(async (connection) => {
                const users = await createData(connection);
                const userA = users[0];

                const userRepository = connection.getRepository(User);
                const userCount = await userRepository.count();
                userCount.should.eql(3);

                const orderRepository = connection.getRepository(Order);
                const orderCount = await orderRepository.count({
                    relations: ["user"],
                    where: { user: userA },
                });
                orderCount.should.eql(2);

                const orderCount2 = await orderRepository.count({
                    relations: ["user", "products"],
                    where: { user: userA },
                });
                orderCount2.should.eql(2);
            })
        ));

    it("QueryBuilder.getCount()", () =>
        Promise.all(
            connections.map(async (connection) => {
                const users = await createData(connection);
                const userA = users[0];

                const userRepository = connection.getRepository(User);
                const userCount = await userRepository
                    .createQueryBuilder("user")
                    .getCount();
                userCount.should.eql(3);

                const orderRepository = connection.getRepository(Order);
                const orderCount = await orderRepository
                    .createQueryBuilder("order")
                    .leftJoin("order.user", "user")
                    .where("user.id = :id", { id: userA.id })
                    .getCount();
                orderCount.should.eql(2);

                const orderCount2 = await orderRepository
                    .createQueryBuilder("order")
                    .leftJoin("order.user", "user")
                    .leftJoin("order.products", "product")
                    .where("user.id = :id", { id: userA.id })
                    .getCount();
                orderCount2.should.eql(2);
            })
        ));

    /*
    it("my first test", () =>
        Promise.all(
            connections.map(async (connection) => {
                const [userA, userB, userC] = await createData(connection);
                console.log(userA, userB, userC);
                //const userRepository = connection.getRepository(User);
                const productRepository = connection.getRepository(Product);
                //const orderRepository = connection.getRepository(Order);

                const products = await productRepository.count();
                console.log(products);
            })
        ));
        */
});
