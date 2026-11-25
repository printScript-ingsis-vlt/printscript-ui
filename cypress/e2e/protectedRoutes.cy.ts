import {testUser} from "../support/backend";

// Los dos primeros entran sin sesión: no hace falta usuario, solo ver adónde manda la app.
// El dominio sale de VITE_AUTH0_DOMAIN en .env (cypress.config.ts pasa el entorno a Cypress.env).
const auth0Origin = () => `https://${Cypress.env('VITE_AUTH0_DOMAIN')}`

describe('Protected routes test', () => {
  it('should redirect to the Auth0 login when accessing a protected route unauthenticated', () => {
    cy.visit('/')

    cy.origin(auth0Origin(), () => {
      cy.location('pathname', {timeout: 15000}).should('include', 'login')
    })
  });

  it('should display login content', () => {
    cy.visit('/')

    cy.origin(auth0Origin(), () => {
      cy.get('input[name="username"], input#username', {timeout: 15000}).should('be.visible')
    })
  });

  it('should not redirect to login when the user is already authenticated', () => {
    const {username, password} = testUser()
    cy.loginToAuth0(username, password)

    cy.location('origin').should('eq', new URL(Cypress.config('baseUrl') as string).origin)
    cy.location('pathname').should('not.include', 'login')
    cy.contains('.MuiTypography-h6', 'Printscript')
  });
})
