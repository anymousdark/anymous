import { describe, test, expect } from "bun:test"
import { normalizeUnicode } from "../../src/patch"

describe("normalizeUnicode", () => {
  test("maps curly single quotes to ASCII quote", () => {
    expect(normalizeUnicode("it\u2019s \u2018fine\u2019")).toBe("it's 'fine'")
  })

  test("maps curly double quotes to ASCII quote", () => {
    expect(normalizeUnicode("\u201Chello\u201D")).toBe('"hello"')
  })

  test("maps en/em dashes to ASCII hyphen", () => {
    expect(normalizeUnicode("a \u2013 b \u2014 c")).toBe("a - b - c")
  })

  test("maps ellipsis and non-breaking spaces", () => {
    expect(normalizeUnicode("waiting\u2026\u00A0now")).toBe("waiting... now")
  })

  test("leaves ordinary ASCII text unchanged", () => {
    expect(normalizeUnicode("plain text 123")).toBe("plain text 123")
  })
})
