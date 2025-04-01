/// <reference types="Cypress" />

describe.skip('Retailers Page', () => {
    beforeEach(() => {
        cy.visit('/');
        cy.get('[data-test="btn-login"]').click()
        cy.get('[id="id-binding-retailers"]').click()
    })

    it('should redirect to id-binding retailers page', () => {

        cy.contains('Retailers List')
        cy.contains('New Retailer')
        cy.contains('Please wait')
        cy.contains('0 of 0')
        cy.location('pathname').should('contain', '/id-binding/retailers')
    })
    it('add new retailer', () => {
        const retailerName = 'peedee elctronics';
        cy.get('[data-test="btn-add-new-retailer"]').click();
        cy.get('[data-test="retailerName"]').type(retailerName);
        cy.get('[data-test="retailerDesc"]').type('peedee elctronics store for all electronics item');
        cy.get('[data-test="btn-save-retailer"]').click()
        cy.contains(retailerName)
        cy.contains('Retailer has been created')
        cy.contains('1 – 1 of 1')

    })
    it('filter by retailer type-offline', () => {
        cy.get('[data-test="select-retailer-type"]').click()
        cy.get('[data-test="select-retailer-type"]').type('{downArrow}')
        cy.get('[data-test="select-retailer-type"]').type('{downArrow}')
        cy.get('[data-test="select-retailer-type"]').type('{ENTER}')
        cy.contains('No records found')
        cy.contains('0 of 0')

    })
    it('deleting a n item', () => {
        // This is left intentionally
    })
})