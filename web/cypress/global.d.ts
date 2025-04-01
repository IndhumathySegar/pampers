/// <reference types="cypress" />

declare namespace Cypress {
    interface Chainable {
        getBySel(dataTestAttribute: string, args?: any): Chainable<Element>;

        // Logs-in user by using UI
        login(username: string, password: string): void;
    }
}