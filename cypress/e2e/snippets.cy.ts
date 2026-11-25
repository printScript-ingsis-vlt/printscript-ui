import {api, cleanUpSnippets, createSnippet, login, uniqueName} from "../support/backend";

// Cómo responde la UI cuando el backend falla. Login y backend reales; en el primer test se fuerza una falla
// (como si permissions no contestara) con cy.intercept, porque no se puede tirar la VM en cada corrida.
describe('Snippets error handling', () => {
  beforeEach(() => login())
  afterEach(() => cleanUpSnippets())

  it('Shows an error when the list fails and recovers with Retry', () => {
    // Mientras `failing` esté prendido, el listado responde el 502 que devuelve snippet-service si permissions no
    // contesta. La app reintenta sola unas veces antes de mostrar el error: por eso la falla dura hasta el Retry.
    let failing = true
    cy.intercept({method: 'GET', pathname: api('/snippets')}, (req) => {
      if (failing) req.reply({statusCode: 502, body: {error: 'PERMISSIONS_UNAVAILABLE', message: 'x', errors: []}})
    }).as('failed')
    cy.reload()
    cy.get('[data-testid="api-error"]', {timeout: 20000}).should('contain', 'not available')

    // Retry vuelve a pedir el listado al backend real, que esta vez contesta bien.
    cy.then(() => {
      failing = false
    })
    cy.contains('button', 'Retry').click()
    cy.get('[data-testid="api-error"]', {timeout: 10000}).should('not.exist')
    cy.get('@failed.all').should((calls) => {
      const last = calls[calls.length - 1] as unknown as { response?: { statusCode: number } }
      expect(last.response?.statusCode, 'el pedido del Retry').to.eq(200)
    })
  })

  it('Shows an error and no editor when the snippet no longer exists', () => {
    const name = uniqueName('borrado')
    createSnippet(name, 'println(1);').then(({id}) => {
      cy.get('input[aria-label="search"]').type(name)
      cy.contains('[data-testid="snippet-row"]', name, {timeout: 15000})

      // Se borra por la API mientras el listado todavía lo muestra; al abrirlo, el backend ya no lo encuentra.
      cy.get<string>('@token').then((token) =>
          cy.request({method: 'DELETE', url: api(`/snippets/${id}`), headers: {authorization: token}}))
      cy.contains('[data-testid="snippet-row"]', name).click()
    })

    cy.get('[data-testid="api-error"]', {timeout: 15000}).should('be.visible')
    // Sin el snippet no se puede guardar encima del contenido real.
    cy.get('[data-testid="SaveIcon"]').should('not.exist')
  })
})
