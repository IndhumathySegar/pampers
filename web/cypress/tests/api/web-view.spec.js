/// <reference types="Cypress" />
const apiEndpoint = `${Cypress.env('apiUrl')}`
const loyalId = '7Y5OZFLHPWMALCFVOHT3VXWSGM'
const queryString = `id=${loyalId}`;

const endPoints = [
    { url: "/retailer", method: "GET" },
    { url: "/detail/lohaco", method: "GET" },
    { url: "/detail/amazon", method: "GET" },
    { url: "/detail/rakuten", method: "GET" },
    { url: "/unbind-complete/lohaco", method: "GET" },
    { url: "/unbind-complete/amazon", method: "GET" },
    { url: "/unbind-complete/rakuten", method: "GET" },
    { url: "/link-complete/lohaco", method: "GET" },
    { url: "/link-complete/amazon", method: "GET" },
    { url: "/link-complete/rakuten", method: "GET" },
    { url: "/link-error/lohaco", method: "GET" },
    { url: "/link-error/amazon", method: "GET" },
    { url: "/link-error/rakuten", method: "GET" },
    { url: "/lottery", method: "GET" },
    { url: "/lottery-draw", method: "GET" },
];

describe('Web-View Test', () => {
    context(`should load page successfully`, function () {
        it('should get 200 Ok', () => {
            endPoints.forEach(endPoint => {
                cy.request({
                    url: `${apiEndpoint}${endPoint.url}?${queryString}`,
                    method: endPoints.method,
                    failOnStatusCode: false
                }).then(response => {
                    expect(response.status).to.eq(200)
                })
            })
        })
    });

})