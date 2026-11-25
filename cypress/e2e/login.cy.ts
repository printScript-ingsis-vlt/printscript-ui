import {api, testUser} from "../support/backend";
import {loginViaAuth0Ui} from "../support/auth-provider-commands/auth0";

// Prueba el login de punta a punta, completando siempre el formulario de Auth0 (los demás specs reutilizan la sesión
// con cy.session). Si pasa, Auth0 emitió el token y snippet-service lo aceptó: firma, issuer y audience válidos.
//
// Hay que correrlo contra una UI que llegue al backend real:
// - la UI desplegada: FRONTEND_URL=https://<host de dev> npx cypress run --spec cypress/e2e/login.cy.ts
// - o la UI local apuntando al backend: BACKEND_PROXY_TARGET=https://<host de dev>/api npm run dev
//   (y que http://localhost:5173 esté en "Allowed Callback URLs" de la aplicación de Auth0).
describe('Login real con Auth0', () => {
  it('inicia sesión y snippet-service acepta el token', () => {
    const {username, password} = testUser()
    // Solo observa el pedido (no responde nada): el listado lo contesta el backend real.
    cy.intercept({method: 'GET', pathname: api('/snippets')}).as('list')

    loginViaAuth0Ui(username, password)

    // 200 con el token real de Auth0. 401 = el token no sirve; 502 = falla un servicio de atrás (por ejemplo permissions).
    cy.wait('@list').its('response.statusCode').should('eq', 200)
    cy.get('input[aria-label="search"]').should('be.visible')
  })
})
