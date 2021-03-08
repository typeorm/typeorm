import "reflect-metadata";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {expect} from "chai";
import {PostgresDriver} from "../../../src/driver/postgres/PostgresDriver";
import { Order } from "./entity/Order";
import { OrderCustomer } from "./entity/OrderCustomer";
import { OrderRepository } from "./repository/OrderRepository";
import { Broker } from "./entity/Broker";
import { BrokerRepository } from "./repository/BrokerRepository";

describe("github issues > #3246", () => {

    let connections: Connection[];

    before(async () => connections = await createTestingConnections({
        entities: [Order, OrderCustomer, Broker],
        schemaCreate: true,
        dropSchema: true,
    }));

    beforeEach(() => reloadTestingDatabases(connections));

    after(() => closeTestingConnections(connections));

    let company = new Broker();
    company.name = "Acme Inc.";

    let order = new Order();
    order.orderReferenceNumber = "abcd";

    const orderCustomer = new OrderCustomer();
    orderCustomer.name = "Dave";

    order.orderCustomer = orderCustomer;

    it("should insert and return the order with id", () => Promise.all(connections.map(async connection => {
      try {
         if (connection.driver instanceof PostgresDriver) {

            const myCompanyRepository = connection.manager.getCustomRepository(BrokerRepository);

            const createdCompany = await myCompanyRepository.createBroker(company);

            const myOrderRepository = connection.manager.getCustomRepository(OrderRepository);

            order.company = createdCompany;

            const result = await myOrderRepository.createOrder(order);

            expect(result.id).not.to.be.undefined;

        }
      } catch (err) {

        throw new Error(err);

      }
     })));
 });
