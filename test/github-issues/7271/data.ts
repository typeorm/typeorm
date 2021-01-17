export const roles = [
    { id: 1, name: "admin", isAdmin: true },
    { id: 2, name: "user", isAdmin: false }
]


export const users = [
    {
        id: 1,
        email: "1111@test.test",
        roleId: 1,
        passwordHash: '',
        nickName: 'Mike',
        lastName: '',
        createdAt: '2021-01-16T23:12:25+00:00'
    },
    {
        id: 2,
        email: "2222@test.test",
        roleId: 1,
        passwordHash: '2021-01-16T23:12:25+00:00',
        nickName: 'Bob',
    },
    {
        id: 3,
        email: "333@test.test",
        roleId: 2,
        passwordHash: '2021-01-16T23:12:25+00:00',
        nickName: 'Alex',
    },
    {
        id: 4,
        email: "44444@test.test",
        roleId: 2,
        passwordHash: '2021-01-16T23:12:25+00:00',
        nickName: 'Kite',
    },
    {
        id: 5,
        email: "5555@test.test",
        roleId: 2,
        passwordHash: '2021-01-16T23:12:25+00:00',
        nickName: 'Ted',
    }
]