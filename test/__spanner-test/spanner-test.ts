// import {ConnectionManager} from "../../src";
// import {Spanner} from "@google-cloud/spanner";
// import {SpannerQueryRunner} from "../../src/driver/spanner/SpannerQueryRunner";
//
// // process.env.SPANNER_EMULATOR_HOST = "localhost:9010"
// process.env.GOOGLE_APPLICATION_CREDENTIALS="/Users/messer/Documents/google/astute-cumulus-342713-80000a3b5bdb.json"
//
// async function main() {
//
//     const projectId = 'astute-cumulus-342713';
//     const instanceId = 'test-instance';
//     const databaseId = 'test-db';
//
//     const spanner = new Spanner({
//         projectId: projectId,
//     });
//
//
//     const instance = spanner.instance(instanceId);
//     const database = instance.database(databaseId);
//     // await database.updateSchema(`CREATE TABLE \`test\` (\`id\` INT64, \`name\` STRING(MAX)) PRIMARY KEY (\`id\`)`)
//     // const [operation] = await database.updateSchema(`DROP TABLE \`test\``)
//     // await operation.promise()
//
//
//     // const query = `INSERT INTO \`test\` (\`id\`, \`name\`) VALUES (@id, @name)`
//     // await database.run(query2)
//     // await runInTransaction(database, query, [1, "Alice"])
//
//     const connectionManager = new ConnectionManager()
//     const connection = connectionManager.create({
//         type: "spanner",
//         projectId,
//         instanceId,
//         databaseId,
//         logging: true
//     })
//
//     const queryRunner = connection.createQueryRunner() as SpannerQueryRunner
//     await queryRunner.dropTable(`DROP TABLE \`test2\``)
//     await queryRunner.updateDDL(`CREATE TABLE \`test\` (\`id\` INT64, \`name\` STRING(MAX)) PRIMARY KEY (\`id\`)`)
//     await queryRunner.updateDDL(`-- ALTER TABLE \`test\` ADD COLUMN \`description\` STRING(MAX)`)
//     await queryRunner.release()
//
//     const createQuery = `INSERT INTO \`test\` (\`id\`, \`name\`) VALUES  (1, "Alice")`
//     const updateQuery = `UPDATE \`test\` SET \`name\`='Bob' WHERE \`id\`=1`
//     const deleteQuery = `DELETE FROM \`test\` WHERE \`id\`=1`
//
//     const [tx] = await database.getTransaction()
//     const res = await tx.run(createQuery)
//     console.log(res);
//     const res2 = await tx.run(updateQuery)
//     console.log(res2);
//     const res3 = await tx.run(deleteQuery)
//     console.log(res3);
//     // [_, { rowCountExact }]
//     await tx.commit()
//
//
//     // const [tx2] = await database.getTransaction()
//     // await tx2.run(`INSERT INTO \`test\` (\`id\`, \`name\`) VALUES (2, "Alice")`)
//     // await tx2.commit()
//     // runInTransaction(database, query1, [])
//     // runInTransaction(database, query2, [])
// }
//
// // async function runInTransaction(database: Database, query: string, params: any[]) {
// //     await database.runTransactionAsync(
// //         // {requestOptions: {transactionTag: 'typeorm'}},
// //         async transaction => {
// //             console.log('start TX');
// //
// //             try {
// //                 const result = await transaction.run({
// //                     sql: query,
// //                     params: params,
// //                 });
// //                 console.log('Inserted', result);
// //                 await transaction.commit();
// //             } catch (err) {
// //                 console.error('ERROR:', err);
// //             } finally {
// //                 // Close the database when finished.
// //                 database.close();
// //             }
// //             // const [rowCount] = await transaction.run({
// //             //     sql: query,
// //             //     params: params,
// //             // });
// //             //
// //             // console.log(
// //             //     `Successfully inserted ${rowCount} record into the Singers table.`
// //             // );
// //
// //
// //             // await tx.runUpdate({
// //             //     sql: `INSERT INTO Venues (VenueId, VenueName, Capacity, OutdoorVenue, LastUpdateTime)
// //             //           VALUES (@venueId, @venueName, @capacity, @outdoorVenue, PENDING_COMMIT_TIMESTAMP())`,
// //             //     params: {
// //             //         venueId: 81,
// //             //         venueName: 'Venue 81',
// //             //         capacity: 1440,
// //             //         outdoorVenue: true,
// //             //     },
// //             //     types: {
// //             //         venueId: {type: 'int64'},
// //             //         venueName: {type: 'string'},
// //             //         capacity: {type: 'int64'},
// //             //         outdoorVenue: {type: 'bool'},
// //             //     },
// //             //     requestOptions: {requestTag: 'app=concert,env=dev,action=update'},
// //             // });
// //             // console.log('Inserted new outdoor venue');
// //
// //             // await transaction.commit();
// //         }
// //     );
// // }
//
//
// main()
