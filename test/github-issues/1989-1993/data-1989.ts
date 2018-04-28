export const defaultData = {
  "role": {
    "name": "UI Designer"
  },
  "roleLevels": [
    {
      "levelId": 1,
      "gradingId": 1,
      "name": "Junior"
    },
    {
      "levelId": 2,
      "gradingId": 2,
    }
  ]
}

export const data = {
  "id": 1,
  "name": "UI Designer (updated)",
  "roleLevels": [
    {
      "id": 1,
      "levelId": 1,
      "gradingId": 2,
      "name": "Junior (updated)"
    },
    {
      "levelId": 3,
      "gradingId": 3,
      "name": "Senior (new)"
    }
  ]
}

export const expectedResult = {
  "id": 1,
  "name": "UI Designer (updated)",
  "roleLevels": [
    {
      "id": 1,
      "levelId": 1,
      "gradingId": 2,
      "roleId": 1,
      "name": "Junior (updated)"
    },
    {
      "id": 2,
      "levelId": 2,
      "gradingId": 2,
      "roleId": 1,
    },
    {
      "levelId": 3,
      "gradingId": 3,
      "roleId": 1,
      "name": "Senior (new)"
    }
  ]
}