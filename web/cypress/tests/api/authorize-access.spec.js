/// <reference types="Cypress" />
const apiEndpoint = `${Cypress.env('apiUrl')}`

context('Protected endpoints - role-based testing', () => {
    let user;
    const adminUser = Cypress.env("ADMIN_USER");
    const guestUser = Cypress.env("GUEST_USER");
    //Method  to authenticate User. 
    //User credentials are taken from separate file (cypress.env.json).

    const authentcatedUser = ({ email, password }) => {
        cy.request({
            url: `${apiEndpoint}/api/auth/login`,
            method: "POST",
            body: {
                email,
                password
            }
        }).its('body').then(res => {
            user = res
        })
    }

    const request = (url, method = "GET") => {
        return cy.request({
            url: `${apiEndpoint}/api/${url}`,
            method,
            headers: {
                Authorization: `Bearer ${user.accessToken}`
            }
        })
    }

    describe('Role: Admin', () => {
        before(() => {
            authentcatedUser(adminUser)
        })

        it('should able to access /api/users', () => {
            request('users').then(res => {
                expect(res.status).to.eq(200)
            })
        })
        it('should able to access /api/roles', () => {
            request('roles').then(res => {
                expect(res.status).to.eq(200)
            })
        })
        it('should able to access /api/id-binding/retailers', () => {
            request('id-binding/retailers').then(res => {
                expect(res.status).to.eq(200)
            })
        })
        it('should able to access /api/id-binding/products', () => {
            request('id-binding/products').then(res => {
                expect(res.status).to.eq(200)
            })
        })
        it('should able to access /api/id-binding/lotteries', () => {
            request('id-binding/lotteries').then(res => {
                expect(res.status).to.eq(200)
            })
        })
    })

    describe('Role: Guest user', () => {
        before(() => {
            authentcatedUser(guestUser)
        })

        it('Guest User has role "User"', () => {
            expect(user).have.property('role', 'user')
        })

        it('should not able to access /api/users', () => {
            cy.request({
                url: `${apiEndpoint}/api/users`,
                method: "GET",
                headers: {
                    Authorization: `Bearer ${user.accessToken}`
                },
                failOnStatusCode: false
            }).then(res => {
                expect(res.status).to.eq(403)
            })
        })
        it('should not able to access /api/roles', () => {
            cy.request({
                url: `${apiEndpoint}/api/roles`,
                method: "GET",
                headers: {
                    Authorization: `Bearer ${user.accessToken}`
                },
                failOnStatusCode: false
            }).then(res => {
                expect(res.status).to.eq(403)
            })
        })
        it('should able to access /api/id-binding/retailers', () => {
            cy.request({
                url: `${apiEndpoint}/api/id-binding/retailers`,
                method: "GET",
                headers: {
                    Authorization: `Bearer ${user.accessToken}`
                },
                failOnStatusCode: false
            }).then(res => {
                expect(res.status).to.eq(200)
            })
        })
        it('should able to access /api/id-binding/products', () => {
            cy.request({
                url: `${apiEndpoint}/api/id-binding/products`,
                method: "GET",
                headers: {
                    Authorization: `Bearer ${user.accessToken}`
                },
                failOnStatusCode: false
            }).then(res => {
                expect(res.status).to.eq(200)
            })
        })
        it('should able to access /api/id-binding/lotteries', () => {
            cy.request({
                url: `${apiEndpoint}/api/id-binding/lotteries`,
                method: "GET",
                headers: {
                    Authorization: `Bearer ${user.accessToken}`
                },
                failOnStatusCode: false
            }).then(res => {
                expect(res.status).to.eq(200)
            })
        })
    })
})