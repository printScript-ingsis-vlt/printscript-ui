import {cleanUpSnippets, createSnippet, login, uniqueName} from "../support/backend";

// Contra el backend real: login con el usuario de prueba de Auth0 y snippet-service de verdad.
describe('Home', () => {
  beforeEach(() => login())
  afterEach(() => cleanUpSnippets())

  it('Renders home', () => {
    cy.contains('.MuiTypography-h6', 'Printscript')
    cy.get('input[aria-label="search"]').should('be.visible')
    cy.contains('button', 'Add Snippet').should('be.visible')
  })

  it('Renders the first page of snippets', () => {
    const name = uniqueName('home')
    createSnippet(name, 'println(1);')
    cy.reload()

    // La primera página pide page=0 y page_size=10: hay al menos el creado y nunca más de 10.
    cy.wait('@list').its('request.query').should('deep.include', {page: '0', page_size: '10'})
    cy.get('[data-testid="snippet-row"]', {timeout: 15000})
        .should('have.length.greaterThan', 0)
        .and('have.length.at.most', 10)
  })

  it('Finds a snippet by name', () => {
    const name = uniqueName('buscar')
    createSnippet(name, 'println(1);')

    cy.get('input[aria-label="search"]').type(name)
    cy.get('[data-testid="snippet-row"]', {timeout: 15000}).should('have.length', 1).and('contain', name)
  })
})
