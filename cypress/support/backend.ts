import {BACKEND_URL} from "../../src/utils/constants";

// Helpers para los specs contra el backend real: login con el usuario de prueba de Auth0, y crear y borrar snippets
// por la API con el mismo token que usa la app, para que cada test arranque con sus datos y no deje basura.

export const api = (path: string) => `${BACKEND_URL}${path}`

const createdIds: string[] = []

/** Usuario de prueba de Auth0 (del .env). Falla claro si falta: sin él, nada de esto está probado. */
export const testUser = () => {
  const username = Cypress.env('AUTH0_USERNAME') as string | undefined
  const password = Cypress.env('AUTH0_PASSWORD') as string | undefined
  if (!username || !password) {
    throw new Error('Faltan AUTH0_USERNAME y AUTH0_PASSWORD en el .env: se necesita un usuario de prueba de Auth0.')
  }
  return {username, password}
}

/** Nombre único por corrida, para encontrar el snippet de este test y no chocar con datos de otros. */
export const uniqueName = (prefix: string) => `cy-${prefix}-${Date.now()}`

/**
 * Inicia sesión, abre la app y guarda como alias `@token` el header Authorization que manda la app al backend.
 * Deja registrado el alias `@list` sobre el listado de snippets.
 */
export const login = () => {
  const {username, password} = testUser()
  cy.intercept({method: 'GET', pathname: api('/snippets')}).as('list')
  cy.loginToAuth0(username, password)
  cy.wait('@list', {timeout: 20000}).then(({request, response}) => {
    expect(response?.statusCode, 'GET /snippets con el token real').to.eq(200)
    cy.wrap(request.headers['authorization'] as string).as('token')
  })
}

/** Crea un snippet directo en snippet-service (más rápido que por la UI) y lo anota para borrarlo al final. */
export const createSnippet = (name: string, content: string) =>
    cy.get<string>('@token').then((token) =>
        cy.request({
          method: 'POST',
          url: api('/snippets'),
          headers: {authorization: token},
          body: {name, description: '', language: 'printscript', content},
        }).then(({status, body}) => {
          expect(status).to.eq(201)
          createdIds.push(body.id)
          return body as { id: string, name: string }
        })
    )

/** Anota un snippet creado por la UI, para borrarlo al final del test. */
export const trackCreated = (id: string) => {
  createdIds.push(id)
}

/** Borra todo lo que creó el test. Ignora los que el propio test ya borró. */
export const cleanUpSnippets = () => {
  const ids = createdIds.splice(0)
  if (ids.length === 0) return
  cy.get<string>('@token').then((token) => {
    ids.forEach((id) =>
        cy.request({method: 'DELETE', url: api(`/snippets/${id}`), headers: {authorization: token}, failOnStatusCode: false}))
  })
}

/** Busca un snippet por nombre en el listado y abre su detalle. */
export const openSnippet = (name: string) => {
  cy.get('input[aria-label="search"]').clear().type(name)
  cy.contains('[data-testid="snippet-row"]', name, {timeout: 15000}).click()
  cy.contains('.MuiDrawer-root h4', name, {timeout: 15000})
}
