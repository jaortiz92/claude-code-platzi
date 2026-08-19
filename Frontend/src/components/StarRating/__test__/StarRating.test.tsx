import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { StarRating } from "../StarRating";

describe("StarRating Component", () => {
  it("renders correct stars for average 4.5", () => {
    const { container } = render(<StarRating average={4.5} count={10} />);
    const stars = container.querySelectorAll("[class*='starRating'] > [class*='star']");
    expect(stars.length).toBe(5);
    expect(screen.getByText("(10)")).toBeDefined();
  });

  it("renders 5 full stars for average 5.0", () => {
    const { container } = render(<StarRating average={5.0} count={20} />);
    const fullStars = container.querySelectorAll("span[class*='full']");
    expect(fullStars.length).toBe(5);
    expect(screen.getByText("(20)")).toBeDefined();
  });

  it("hides count when count is 0", () => {
    render(<StarRating average={3.0} count={0} />);
    expect(screen.queryByText("(0)")).toBeNull();
  });

  it("has correct aria-label", () => {
    render(<StarRating average={4.5} count={10} />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute(
      "aria-label",
      "Promedio: 4.5 de 5 estrellas, 10 calificaciones"
    );
  });

  it("applies size class", () => {
    const { container } = render(<StarRating average={3} count={5} size="lg" />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toMatch(/lg/);
  });
});
