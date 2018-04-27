export const dataToInsert = {
  id: null,
  name: 'UI Designer',
  roleLevels: [
    {
      id: null,
      roleId: null,
      levelId: 2,
      gradingId: 3,
      name: 'Junior'
    },
    {
      id: null,
      roleId: null,
      levelId: 3,
      gradingId: 4,
      name: null
    },
    {
      id: null,
      roleId: null,
      levelId: 4,
      gradingId: 5,
      name: 'Senior'
    }]
};

export const expectedResult = {
  id: 1,
  name: 'UI Designer',
  roleLevels: [
    {
      id: 1,
      roleId: 1,
      levelId: 2,
      gradingId: 3,
      name: 'Junior'
    },
    {
      id: 2,
      roleId: 1,
      levelId: 3,
      gradingId: 4,
      name: null
    },
    {
      id: 3,
      roleId: 1,
      levelId: 4,
      gradingId: 5,
      name: 'Senior'
    }]
};