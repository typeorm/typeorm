import { DataSource } from '../../../src';
import { createTestingConnections, reloadTestingDatabases } from '../../utils/test-utils';
import { User } from './entities/User';
import { ConditionLoaderOptions } from '../../../src/query-builder/condition-loader/ConditionLoader';
import { expect } from 'chai';

describe('github issues > #9316 specify how should interpret null and undefined values in conditions ', () => {
    let dataSources: DataSource[] = []

    const createConnectionWith = async (conditions: ConditionLoaderOptions) => {
        if (dataSources.length) {
            await Promise.all(dataSources.map((dataSource) => dataSource.destroy()));
        }

        dataSources = await createTestingConnections({
            conditions,
            entities: [User],
            enabledDrivers: ['postgres'],
            schemaCreate: true,
            dropSchema: true,
        })
    }

    beforeEach(() => reloadTestingDatabases(dataSources));
    after(() => Promise.all(dataSources.map((dataSource) => dataSource.destroy())));

    it('it should interpret "null" values in condition as "IS NULL" and "undefined" values ', async () => {
        await createConnectionWith({nullValues: 'is-null', undefinedValues: 'exclude' });

        await Promise.all(dataSources.map(async (connection) => {
            const john = new User();
            john.name = 'John';
            john.age = 25;

            const jane = new User();
            jane.name = 'Jane';
            jane.age = null;

            await connection.manager.save(john);
            await connection.manager.save(jane);

            const usersWithNullAge = await connection.manager.find(User,
                {
                    where: {age: null},
                });

            // Only Jane should be returned
            expect(usersWithNullAge).to.have.length(1);

            const [janeReturned] = usersWithNullAge;

            expect(janeReturned.name).to.be.equal('Jane');
            expect(janeReturned.age).to.be.null;

            const usersWithUndefinedAge = await connection.manager.find(User, {
                where: {
                    age: undefined,
                },
            });

            // "age" should be excluded from the query, so both users should be returned
            expect(usersWithUndefinedAge).to.have.length(2);

            const janeReturned2 = usersWithUndefinedAge.find((user) => user.name === 'Jane');
            const johnReturned = usersWithUndefinedAge.find((user) => user.name === 'John');

            expect(janeReturned2?.name).to.be.equal('Jane');
            expect(janeReturned2?.age).to.be.null;

            expect(johnReturned?.name).to.be.equal('John');
            expect(johnReturned?.age).to.be.equal(25);
        }));
    });

    it('it should interpret "null" values in condition as "IS NULL" and "undefined" values as "IS NULL"', async () => {
        await createConnectionWith({nullValues: 'is-null', undefinedValues: 'is-null'});

        await Promise.all(dataSources.map(async (connection) => {
            const john = new User();
            john.name = 'John';
            john.age = 25;

            const jane = new User();
            jane.name = 'Jane';
            jane.age = null;

            await connection.manager.save(john);
            await connection.manager.save(jane);

            const usersWithNullAge = await connection.manager.find(User,
                {
                    where: {age: null},
                });

            // Only Jane should be returned
            expect(usersWithNullAge).to.have.length(1);

            const [janeReturned] = usersWithNullAge;

            expect(janeReturned.name).to.be.equal('Jane');
            expect(janeReturned.age).to.be.null;

            const usersWithUndefinedAge = await connection.manager.find(User, {
                where: {
                    age: undefined,
                },
            });

            // "age" should be excluded from the query, so both users should be returned
            expect(usersWithUndefinedAge).to.have.length(1);

            const janeReturned2 = usersWithUndefinedAge.find((user) => user.name === 'Jane');

            expect(janeReturned2?.name).to.be.equal('Jane');
            expect(janeReturned2?.age).to.be.null;
        }));
    })

    it('it should exclude "null" and "undefined" values in condition', async () => {
        await createConnectionWith({nullValues: 'exclude', undefinedValues: 'exclude'});

        await Promise.all(dataSources.map(async (connection) => {
            const john = new User();
            john.name = 'John';
            john.age = 25;

            const jane = new User();
            jane.name = 'Jane';
            jane.age = null;

            await connection.manager.save(john);
            await connection.manager.save(jane);

            const usersWithNullAge = await connection.manager.find(User,
                {
                    where: {age: null},
                });

            // "age" should be excluded from the query, so both users should be returned
            expect(usersWithNullAge).to.have.length(2);

            const usersWithUndefinedAge = await connection.manager.find(User, {
                where: {
                    age: undefined,
                },
            });

            // "age" should be excluded from the query, so both users should be returned
            expect(usersWithUndefinedAge).to.have.length(2);
        }));
    })
});
