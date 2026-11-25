// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'
import {loginWithSession} from "./auth-provider-commands/auth0";

// Login real con Auth0, una sola vez por corrida (ver auth-provider-commands/auth0.ts).
Cypress.Commands.add('loginToAuth0', (username: string, password: string) => {
  loginWithSession(username, password)
})
