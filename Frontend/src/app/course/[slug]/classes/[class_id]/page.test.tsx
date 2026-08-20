import { describe, it, expect } from "vitest";
import ClassPage from "./page";

describe("ClassPage", () => {
  it("exports an async server component", () => {
    expect(typeof ClassPage).toBe("function");
  });
});
