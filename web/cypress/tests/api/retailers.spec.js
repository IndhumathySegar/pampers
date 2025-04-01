/// <reference types="Cypress" />
const endpoint = '/api/id-binding/retailers'
const apiEndpoint = `${Cypress.env('apiUrl')}${endpoint}`

const addRetailer = title =>
  cy.request('POST', apiEndpoint, {
    retailerName: 'amazon',
    retailerDesc: 'amaozon india',
    retailerBanner: 'https://amazon.in',
    retailerType: 'online'
  })

const fetchRetailers = () => cy.request(apiEndpoint)
