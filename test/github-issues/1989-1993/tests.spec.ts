import { createConnection, getConnection, Connection, Repository } from 'typeorm';
import 'mocha';
import { expect } from 'chai';

import { Role } from "./entity/role.entity";
import { RoleLevel } from './entity/role-level.entity';
import * as cascadeCreate from './data-1993';
import * as cascadeUpdate from './data-1989';

describe('Cascade create', () => {

  let connection: Connection;
  let roleRepository: Repository<Role>;

  beforeEach(async () => {
    connection = await createConnection();
    await connection.dropDatabase();
    await connection.synchronize();
    roleRepository = connection.getRepository(Role);
  });
  
  afterEach(async () => {
    connection.close();
  });

  it('should save all passed children', async () => {
    const roleData = roleRepository.create(cascadeCreate.data);
    const result = await roleRepository.save(roleData);
    expect(result).to.equal(cascadeCreate.expectedResult);
  });

});

describe('Cascade update', () => {

  let connection: Connection;
  let roleRepository: Repository<Role>;

  beforeEach(async () => {
    connection = await createConnection();
    await connection.dropDatabase();
    await connection.synchronize();

    const role = new Role();
    role.name = cascadeUpdate.defaultData.role.name;
    role.roleLevels = [];
    cascadeUpdate.defaultData.roleLevels.forEach(data => {
      const roleLevel = new RoleLevel();
      Object.assign(roleLevel, data);
      role.roleLevels.push(roleLevel);
    });
    roleRepository = connection.getRepository(Role);
    await roleRepository.save(role);
  });

  afterEach(async () => {
    connection.close();
  });

  it('(option 1) should only return the updated children', async () => {
    const roleData = await roleRepository.preload(cascadeUpdate.data);
    const result = await roleRepository.save(roleData);
    expect(result).to.equal(cascadeUpdate.expectedResult);
  });

  it('(option 2) should not encounter error: null value in column "roleId" violates not-null constraint', async () => {
    const roleData = await roleRepository.create(cascadeUpdate.data);
    const result = await roleRepository.save(roleData);
    expect(result).to.equal(cascadeUpdate.expectedResult);
  });

});