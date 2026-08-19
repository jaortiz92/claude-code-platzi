import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { StarRatingInteractive } from "../StarRatingInteractive";

vi.mock("@/services/api", () => ({
  submitCourseRating: vi.fn(),
}));

import { submitCourseRating } from "@/services/api";

describe("StarRatingInteractive Component", () => {
  const mockSlug = "react-fundamentals";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders 5 star buttons", () => {
    render(
      <StarRatingInteractive slug={mockSlug} initialUserRating={null} />
    );
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBe(5);
  });

  it("highlights stars on hover", () => {
    render(
      <StarRatingInteractive slug={mockSlug} initialUserRating={null} />
    );
    const buttons = screen.getAllByRole("button");
    fireEvent.mouseEnter(buttons[2]);
    expect(buttons[0].className).toMatch(/active/);
    expect(buttons[1].className).toMatch(/active/);
    expect(buttons[2].className).toMatch(/active/);
    expect(buttons[3].className).not.toMatch(/active/);
  });

  it("submits rating on click", async () => {
    vi.mocked(submitCourseRating).mockResolvedValue({
      average: 4,
      count: 1,
      user_rating: 4,
    });

    render(
      <StarRatingInteractive slug={mockSlug} initialUserRating={null} />
    );
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[3]);

    await waitFor(() => {
      expect(submitCourseRating).toHaveBeenCalledWith(mockSlug, 4);
    });
  });

  it("calls onRatingSubmitted callback", async () => {
    vi.mocked(submitCourseRating).mockResolvedValue({
      average: 3,
      count: 1,
      user_rating: 3,
    });

    const onRatingSubmitted = vi.fn();
    render(
      <StarRatingInteractive
        slug={mockSlug}
        initialUserRating={null}
        onRatingSubmitted={onRatingSubmitted}
      />
    );

    fireEvent.click(screen.getAllByRole("button")[2]);

    await waitFor(() => {
      expect(onRatingSubmitted).toHaveBeenCalled();
    });
  });

  it("shows error on API failure", async () => {
    vi.mocked(submitCourseRating).mockRejectedValue(new Error("Network error"));

    render(
      <StarRatingInteractive slug={mockSlug} initialUserRating={null} />
    );

    fireEvent.click(screen.getAllByRole("button")[0]);

    await waitFor(() => {
      expect(screen.getByText("No se pudo guardar tu calificación")).toBeDefined();
    });
  });

  it("displays initial user rating", () => {
    render(
      <StarRatingInteractive slug={mockSlug} initialUserRating={3} />
    );
    const buttons = screen.getAllByRole("button");
    expect(buttons[2].className).toMatch(/active/);
  });
});
