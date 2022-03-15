// import {Spanner} from "@google-cloud/spanner";
//
// process.env.SPANNER_EMULATOR_HOST = "localhost:9010"
// // process.env.GOOGLE_APPLICATION_CREDENTIALS="/Users/messer/Documents/google/astute-cumulus-342713-80000a3b5bdb.json"
//
// async function main() {
//
//     const projectId = 'test-project';
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
//
//     // const [operation] = await database.updateSchema(`CREATE TABLE \`test\` (\`id\` INT64, \`name\` STRING(MAX)) PRIMARY KEY (\`id\`)`)
//     // await operation.promise()
//     // const [tx] = await database.getTransaction()
//     // await tx.runUpdate(`INSERT INTO \`book\`(\`ean\`) VALUES ('asd')`)
//     // await tx.commit()
//
//     // await database.run(`INSERT INTO \`book\`(\`ean\`) VALUES ('asd')`)
//
//     const [session] = await database.createSession({})
//     const sessionTransaction = await session.transaction()
//
//     await sessionTransaction.begin()
//     await sessionTransaction.run(`INSERT INTO \`category\`(\`id\`, \`name\`) VALUES (1, 'aaa')`)
//     await sessionTransaction.commit()
//
//     await sessionTransaction.begin()
//     await sessionTransaction.run(`INSERT INTO \`category\`(\`id\`, \`name\`) VALUES (2, 'bbb')`)
//     await sessionTransaction.rollback()
//
//     // const first = async () => {
//     //     const sessionTransaction = await session.transaction()
//     //     await sessionTransaction.begin()
//     //     await sessionTransaction.run(`INSERT INTO \`category\`(\`id\`, \`name\`) VALUES (1, 'aaa')`)
//     //     await sessionTransaction.commit()
//     // }
//     //
//     // const second = async () => {
//     //     const sessionTransaction = await session.transaction()
//     //     await sessionTransaction.begin()
//     //     await sessionTransaction.run(`INSERT INTO \`category\`(\`id\`, \`name\`) VALUES (2, 'bbb')`)
//     //     await sessionTransaction.commit()
//     // }
//     //
//     // await Promise.all([
//     //     first(),
//     //     second()
//     // ])
// }
//
//
// main()
