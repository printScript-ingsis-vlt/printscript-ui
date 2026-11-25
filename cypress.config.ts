import { defineConfig } from "cypress";
import dotenv from 'dotenv'
import {FRONTEND_URL} from "./src/utils/constants";
dotenv.config()

export default defineConfig({
  e2e: {
    setupNodeEvents(_, config) {
      config.env = process.env
      return config
    },
    experimentalStudio: true,
    // Pantalla de notebook: con la de 1000x660 por defecto, el modal de crear snippet no entra entero.
    viewportWidth: 1440,
    viewportHeight: 1000,
    // FRONTEND_URL de .env (dotenv ya corrió acá); el import de constants se evalúa antes de dotenv y no la ve.
    baseUrl: process.env.FRONTEND_URL || FRONTEND_URL,
  },
});
