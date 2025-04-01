/// <reference types="Cypress" />
const apiEndpoint = `${Cypress.env('apiUrl')}/api`

const endPoints = [
    { url: "id-binding/retailers", method: "GET" },
    { url: "id-binding/products", method: "GET" },
    { url: "id-binding/lotteries", method: "GET" },
    { url: "id-binding/id-pos/amazon", method: "GET" },
    { url: "id-binding/id-pos-data", method: "GET" },
    { url: "id-binding/binded-users", method: "GET" },
    { url: "id-binding/binded-users/dsd43", method: "GET" },
    { url: "users", method: "GET" },
    { url: "users", method: "GET" },
    { url: "auth/logout", method: "GET" },
    // { url: "auth/password/change", method: "POST" },
    { url: "roles", method: "GET" }
];

describe('API Test', () => {
    context(`UNAUTHORIZED ACCESS`, function () {
        it('should get 401', () => {
            endPoints.forEach(endPoint => {
                cy.request({
                    url: `${apiEndpoint}/${endPoint.url}`,
                    method: endPoints.method,
                    failOnStatusCode: false
                }).then(response => {
                    expect(response.status).to.eq(401)
                })
            })
        })
    });

})
// headers: ({ Authorization: `Bearer ${token}` }),