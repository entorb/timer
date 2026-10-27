import { describe, expect, it } from "vitest"

import { pickById } from "../list"

describe("pickById", () => {
  const items = [{ id: "a" }, { id: "b" }]
  it("finds by id, falls back to first, undefined if empty", () => {
    expect(pickById(items, "b")).toBe(items[1])
    expect(pickById(items, "gone")).toBe(items[0])
    expect(pickById([], "a")).toBeUndefined()
  })
})
