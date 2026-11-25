// Login real con Auth0 (Universal Login): la app redirige al login de Auth0, se completa el formulario con un usuario
// de prueba y Auth0 devuelve al usuario a la app con sesión iniciada.
//
// Necesita:
// - Un usuario de prueba de tipo usuario y contraseña (no una cuenta de Google) creado en Auth0.
// - AUTH0_USERNAME y AUTH0_PASSWORD en el .env (que no se commitea; cypress.config.ts los pasa a Cypress.env).
// - VITE_AUTH0_DOMAIN en el .env: el dominio del tenant, el mismo que usa la UI.
// - El origen de la app (baseUrl) en "Allowed Callback URLs" de la aplicación de Auth0.
export function loginViaAuth0Ui(username: string, password: string) {
  const auth0Domain = Cypress.env('VITE_AUTH0_DOMAIN') as string | undefined
  if (!auth0Domain) {
    throw new Error('Falta VITE_AUTH0_DOMAIN en el .env: es el dominio de Auth0 al que redirige la app.')
  }

  // La app exige sesión: al abrirla redirige al login de Auth0.
  cy.visit('/')

  // El login está en otro dominio: cy.origin permite actuar ahí.
  cy.origin(
      `https://${auth0Domain}`,
      {args: {username, password}},
      ({username, password}) => {
        cy.get('input[name="username"], input#username', {timeout: 20000}).type(username)
        // {enter} envía el formulario sin depender del texto ni del tipo del botón (que cambia entre versiones de Auth0).
        cy.get('input[name="password"], input#password').type(`${password}{enter}`, {log: false})
      }
  )

  // Auth0 devolvió a la app: vuelve al origen del baseUrl y carga la pantalla principal.
  const appOrigin = new URL(Cypress.config('baseUrl') as string).origin
  cy.location('origin', {timeout: 20000}).should('eq', appOrigin)
  cy.contains('.MuiTypography-h6', 'Printscript', {timeout: 20000}).should('be.visible')
}

/**
 * Inicia sesión una sola vez y la reutiliza en todos los tests (cy.session guarda las cookies de la app y de Auth0).
 * Al restaurarla, la app pide el token a Auth0 sin mostrar el formulario. Termina con la app abierta en "/".
 */
export function loginWithSession(username: string, password: string) {
  cy.session(['auth0', username], () => loginViaAuth0Ui(username, password), {
    cacheAcrossSpecs: true,
  })
  cy.visit('/')
  cy.contains('.MuiTypography-h6', 'Printscript', {timeout: 20000}).should('be.visible')
}
