/// <reference types="Cypress" />

describe('should redirect unauthenticated user to login page', () => {
    beforeEach(()=>{
        // cy.visit()
    })
    it('path: / => should redirect to login page', () => {
        cy.visit('/');
        cy.location('pathname').should('contains', '/auth/login')
        cy.contains('Sign In').should('exist')
    })
 

})