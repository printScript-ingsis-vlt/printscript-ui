import {api, cleanUpSnippets, login, trackCreated, uniqueName} from "../support/backend";

// Contra el backend real: los snippets se crean de verdad en snippet-service y se borran al terminar cada test.
describe('Add snippet tests', () => {
  beforeEach(() => {
    login()
    cy.intercept({method: 'POST', pathname: api('/snippets')}).as('create')
  })
  afterEach(() => cleanUpSnippets())

  it('Can add snippets manually', () => {
    const name = uniqueName('manual')

    cy.contains('button', 'Add Snippet').click()
    cy.contains('li', 'Create snippet').click()
    cy.get('#name').type(name)
    cy.get('#demo-simple-select').click()
    cy.get('[data-testid="menu-option-printscript"]').click()
    cy.get('[data-testid="add-snippet-code-editor"]').type('println(1);')
    cy.contains('button', 'Save Snippet').click()

    cy.wait('@create').then(({request, response}) => {
      expect(response?.statusCode).to.eq(201)
      expect(request.body).to.include({name, language: 'printscript', content: 'println(1);'})
      trackCreated(response?.body.id)
    })
    // Al guardar, el modal se cierra y el snippet aparece en el listado.
    cy.get('[data-testid="add-snippet-code-editor"]').should('not.exist')
    cy.get('input[aria-label="search"]').type(name)
    cy.contains('[data-testid="snippet-row"]', name, {timeout: 15000})
  })

  it('Can add snippets via file', () => {
    // Elegir el archivo abre el modal con el nombre y el código del archivo ya cargados.
    cy.get('[data-testid="upload-file-input"]').selectFile("cypress/fixtures/valid_snippet.ps", {force: true})
    cy.get('#name').should('have.value', 'valid_snippet')
    // El nombre se cambia para que sea único en la base compartida de dev.
    const name = uniqueName('archivo')
    cy.get('#name').clear().type(name)
    cy.contains('button', 'Save Snippet').click()

    // Desde archivo se manda como multipart (el archivo va tal cual).
    cy.wait('@create').then(({request, response}) => {
      expect(response?.statusCode).to.eq(201)
      expect(request.headers['content-type']).to.include('multipart/form-data')
      trackCreated(response?.body.id)
    })
  })

  it('Keeps the modal open and shows the error when the snippet is invalid', () => {
    cy.contains('button', 'Add Snippet').click()
    cy.contains('li', 'Create snippet').click()
    cy.get('#name').type(uniqueName('invalido'))
    cy.get('[data-testid="add-snippet-code-editor"]').type('let @@')
    cy.contains('button', 'Save Snippet').click()

    // snippet-service valida con el parser de PrintScript y rechaza el código: no se guarda nada.
    cy.wait('@create').its('response.statusCode').should('eq', 400)
    cy.get('[data-testid="api-error"]').should('be.visible')
    cy.get('[data-testid="add-snippet-code-editor"]').should('exist')
  })
})
