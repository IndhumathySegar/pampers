/// <reference types="Cypress" />

describe('Login Page', () => {
    beforeEach(() => {
        cy.visit('/')
    })
    describe('input validation', () => {
        it('input email is required', () => {
            // cy.getBySel("input-email").clear()
            cy.get('[data-test="input-email"]').clear();
            cy.get('[data-test="input-email"]').blur()

            cy.contains('Required field')
        })
        it('input password is required', () => {
            cy.get('[data-test="input-password"]').clear();
            cy.get('[data-test="input-password"]').blur()

            cy.contains('Required field')
        })
        it('invalid email', () => {
            cy.get('[data-test="input-email"]').clear();
            cy.get('[data-test="input-email"]').type('nilesh');
            cy.get('[data-test="input-email"]').blur()

            cy.contains('Field is not valid')
        })

    })

    describe('invalid login', () => {
        it('invalid email or password', () => {
            cy.get('[data-test="input-email"]').clear();
            cy.get('[data-test="input-password"]').clear();
            cy.get('[data-test="input-email"]').type('nilesh@gmail45454.com');
            cy.get('[data-test="input-password"]').type('nilesh@gmail4');
            cy.get('[data-test="btn-login"]').click()
            cy.contains('The login detail is incorrect')
        })
        it('should error for an invalid password for existing user', () => {
            cy.get('[data-test="input-password"]').clear();
            cy.get('[data-test="input-password"]').type('aaa')
            cy.get('[data-test="btn-login"]').click()
            cy.contains('The login detail is incorrect')
        })
    })
    describe('valid login', () => {
        beforeEach(() => {
            cy.get('[data-test="btn-login"]').click()
        })
        it('should redirect to id-binding products page', () => {
            cy.get('[id="id-binding-products"]').click()
            cy.contains('Products List')
            cy.contains('New Product')
            cy.contains('Please wait')
            cy.contains('0 of 0')
            cy.location('pathname').should('contain', '/id-binding/products')
        })
        it('should redirect to id-binding retailers page', () => {
            cy.get('[id="id-binding-retailers"]').click()
            cy.contains('Retailers List')
            cy.contains('New Retailer')
            cy.contains('Please wait')
            cy.contains('0 of 0')
            cy.location('pathname').should('contain', '/id-binding/retailers')
        })
        it('should redirect to id-binding lottery page', () => {
            cy.get('[id="id-binding-lottery"]').click()
            cy.contains('Lottery Campaign List')
            cy.contains('New Lottery Campaign')
            cy.contains('Please wait')
            cy.contains('0 of 0')
            cy.location('pathname').should('contain', '/id-binding/lottery')
        })

    })
})