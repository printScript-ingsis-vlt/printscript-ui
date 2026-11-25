# Printscript UI

This is a React project using Vite and Node.js 20. This README will guide you on how to set up and start the project locally.

## Prerequisites

Before you begin, ensure you have met the following requirements:

- You have installed Node.js 20 or later
- You have installed npm

## Getting Started

To get a local copy up and running, follow these steps:

### 1. Fork this Repository in your github account

### 2. Clone the Repository

```bash
git clone https://github.com/your-username/printscript-ui.git
```

###  3. Navigate to the Project Directory
```bash
cd printscript-ui
```

### 4. Install Dependencies
```bash
npm install
```

### 5. Start the Development Server

```bash
npm run dev
```

This will start the Vite development server. You can now open your browser and navigate to http://localhost:5173/ to see the application running.

## Build production version

To use this UI in production you should use an optimized and static version, this command will generate this version in `dist` directory:  

```bash
npm run build
```

## Cypress

To start cypress, make sure that the UI is running and enter: 

```bash
npm run cypress
```

Los specs de `cypress/e2e` usan el login **real** de Auth0 y el backend **real**: crean, editan, comparten, ejecutan y
borran snippets en snippet-service, y cada test borra lo que creó. Necesitan en el `.env` (que no se commitea):

- `AUTH0_USERNAME` y `AUTH0_PASSWORD`: un usuario de prueba de Auth0 de tipo usuario y contraseña.
- `VITE_AUTH0_DOMAIN`: el dominio de Auth0.
- `FRONTEND_URL`: la UI desplegada contra la que se corre (por ejemplo la de dev). Su origen tiene que estar en
  "Allowed Callback URLs" de la aplicación de Auth0.

Para correrlos sin ventana:

```bash
npx cypress run
```

El login se hace una vez y se reutiliza (`cy.session`); `login.cy.ts` completa siempre el formulario de Auth0.
El único caso con una falla simulada es el del listado que devuelve 502 (`snippets.cy.ts`), porque no se puede tirar
un servicio en cada corrida.

## Start working

1. Fork the Project
2. Do your magic

## Contributing

1. Create your Feature Branch in this repo (git checkout -b feature/AmazingFeature)
2. Commit your Changes (git commit -m 'Add some AmazingFeature')
3. Push to the Branch (git push origin feature/AmazingFeature)
4. Open a Pull Request

## Tasks

- [ ] Integrate Auth0 UI and private routes
- [ ] Integrate your endpoints to the UI (Create custom "SnippetOperations")
- [ ] Dockerize
- [ ] CI/CD
- [ ] Sockets*
