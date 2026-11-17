import {describe, it} from "node:test";
import assert from "node:assert/strict";
import {describeError} from "../../src/utils/http/apiError.ts";

// Lo mínimo que axios.isAxiosError reconoce como error de axios.
const axiosError = (status: number, data: unknown) => ({isAxiosError: true, response: {status, data}})

const NOT_FORMATTED = {error: "FORMATTED_VERSION_NOT_FOUND", message: "Snippet 1 has not been formatted yet", errors: []}

describe("describeError", () => {
    it("usa el mensaje amigable cuando el cuerpo llega como objeto", () => {
        const info = describeError(axiosError(404, NOT_FORMATTED))
        assert.equal(info.message, "This snippet is still being formatted. Try again in a few seconds.")
    })

    it("usa el mensaje amigable cuando el cuerpo llega como texto (descarga con responseType text)", () => {
        const info = describeError(axiosError(404, JSON.stringify(NOT_FORMATTED)))
        assert.equal(info.message, "This snippet is still being formatted. Try again in a few seconds.")
    })

    it("con un cuerpo de texto que no es JSON cae en el mensaje genérico con el status", () => {
        const info = describeError(axiosError(502, "<html>Bad Gateway</html>"))
        assert.equal(info.message, "Something went wrong (502).")
    })
})
