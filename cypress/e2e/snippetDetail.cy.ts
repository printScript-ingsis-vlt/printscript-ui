import {api, cleanUpSnippets, createSnippet, login, openSnippet, uniqueName} from "../support/backend";

// Contra el backend real: cada test crea su snippet en snippet-service, lo abre desde el listado y lo borra al final.
describe('Snippet detail tests', () => {
  let name: string

  beforeEach(() => {
    login()
    name = uniqueName('detalle')
    createSnippet(name, 'println(1);')
    openSnippet(name)
  })
  afterEach(() => cleanUpSnippets())

  it('Can share a snippet', () => {
    cy.intercept({method: 'GET', pathname: api('/users')}).as('users')
    cy.intercept({method: 'POST', pathname: api('/snippets/*/share')}).as('share')

    // Los usuarios salen de Auth0 (snippet-service consulta la Management API con el token M2M).
    cy.get('[aria-label="Share"]').click()
    cy.get('input[type="text"]').last().type('a')
    cy.wait('@users').its('response.statusCode').should('eq', 200)
    cy.get('li[role="option"]', {timeout: 10000}).first().click()
    cy.contains('button', /^Share$/).click()

    // permissions guarda el permiso de lectura para ese usuario.
    cy.wait('@share').its('response.statusCode').should('be.oneOf', [200, 201, 204])
  })

  it('Can run snippets', () => {
    // La ejecución va por WebSocket a print-script-engine, que lee el código guardado y devuelve la salida.
    cy.contains('Press Run to execute the saved snippet.')
    cy.contains('button', 'Run').click()

    cy.get('[data-testid="execution-console"]', {timeout: 20000}).should('contain', '1')
    cy.contains('.MuiChip-label', 'Finished', {timeout: 20000})
  })

  it('Can download the formatted version', () => {
    cy.intercept({method: 'GET', pathname: api('/snippets/*/download')}).as('download')

    cy.get('[aria-label="Download"]').click()
    cy.contains('li', 'Download formatted').click()

    cy.wait('@download').then(({request, response}) => {
      expect(request.query).to.deep.include({version: 'formatted'})
      expect(response?.statusCode).to.eq(200)
      expect(response?.body).to.contain('println(1);')
    })
  })

  it('Can save snippets', () => {
    cy.intercept({method: 'PUT', pathname: api('/snippets/*')}).as('update')

    cy.get('.MuiDrawer-root textarea').type(' println(2);')
    cy.get('[aria-label="Save changes"]').click()

    cy.wait('@update').then(({request, response}) => {
      expect(request.body).to.deep.equal({content: 'println(1); println(2);'})
      expect(response?.statusCode).to.eq(200)
    })
    // Al volver a abrirlo, el contenido guardado es el nuevo.
    cy.get('[data-testid="CloseIcon"]').click()
    openSnippet(name)
    cy.get('.MuiDrawer-root textarea').should('have.value', 'println(1); println(2);')
  })

  it('Can delete snippets', () => {
    cy.intercept({method: 'DELETE', pathname: api('/snippets/*')}).as('delete')

    cy.get('[aria-label="Delete"]').click()
    cy.contains('Are you sure you want to delete this snippet?').parent().within(() => {
      cy.contains('button', 'Delete').click()
    })

    cy.wait('@delete').its('response.statusCode').should('eq', 204)
    cy.get('input[aria-label="search"]').clear().type(name)
    cy.contains('[data-testid="snippet-row"]', name).should('not.exist')
  })
})
