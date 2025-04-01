/// <reference types="Cypress" />
const apiEndpoint = `${Cypress.env('apiUrl')}`
const loyalId = 'JR3k4W8XC3GP'
const queryString = `?id=${loyalId}`;
describe('lottery draw page', () => {
    beforeEach(() => {
        cy.visit(`${apiEndpoint}/retailer${queryString}`)
    })
    it('page loads', () => {
        cy.location('pathname').should('contain', `retailer${queryString}`)
    })
})