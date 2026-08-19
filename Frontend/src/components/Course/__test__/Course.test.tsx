import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Course } from "../Course";

describe("Course Component", () => {
  const mockCourse = {
    id: 1,
    title: "React Fundamentals",
    teacher: "John Doe",
    duration: 120,
    thumbnail: "https://example.com/thumbnail.jpg",
  };

  it("renders course information correctly", () => {
    render(<Course {...mockCourse} />);

    expect(screen.getByText(mockCourse.title)).toBeDefined();
    expect(screen.getByText(`Profesor: ${mockCourse.teacher}`)).toBeDefined();
    expect(screen.getByText(`Duración: ${mockCourse.duration} minutos`)).toBeDefined();
  });

  it("renders thumbnail with correct alt text", () => {
    render(<Course {...mockCourse} />);

    const thumbnail = screen.getByRole("img", { name: mockCourse.title });
    expect(thumbnail).toHaveAttribute("src", mockCourse.thumbnail);
    expect(thumbnail).toHaveAttribute("alt", mockCourse.title);
  });

  it("renders with correct structure", () => {
    const { container } = render(<Course {...mockCourse} />);

    expect(container.querySelector("article")).toBeDefined();
    expect(container.querySelector("div > img")).toBeDefined();
    expect(container.querySelector("div > h2")).toBeDefined();
    expect(container.querySelector("div > p")).toBeDefined();
  });

  it("shows rating when provided", () => {
    const rating = { average: 4.5, count: 10, userRating: null };
    render(<Course {...mockCourse} rating={rating} />);
    expect(screen.getByText("(10)")).toBeDefined();
  });

  it("does not show rating when count is 0", () => {
    const rating = { average: 0, count: 0, userRating: null };
    render(<Course {...mockCourse} rating={rating} />);
    expect(screen.queryByText("(0)")).toBeNull();
  });
});
