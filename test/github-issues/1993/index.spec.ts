import { createConnection } from 'typeorm';
import 'mocha';
import { expect } from 'chai';
import { Role } from "./entity/role.entity";
import { dataToInsert, expectedResult } from './data';

describe('cascadeCreate', () => {

  beforeEach(async () => {
    const connection = await createConnection();
    await connection.dropDatabase();
    await connection.close();
  })

  it('should save all passed children', async () => {
    const connection = await createConnection();
    const roleRepository = connection.getRepository(Role);
    const role = roleRepository.create(dataToInsert);
    const result = await roleRepository.save(role);
    expect(result).to.equal(expectedResult);
  });

});