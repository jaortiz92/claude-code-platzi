import { CourseRating } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface CourseRatingResponse {
  average: number;
  count: number;
  user_rating: number | null;
}

export async function getCourseRating(slug: string): Promise<CourseRating> {
  try {
    const res = await fetch(`${API_BASE_URL}/courses/${slug}/rating`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return { average: 0, count: 0, userRating: null };
    }

    const data: CourseRatingResponse = await res.json();
    return {
      average: data.average,
      count: data.count,
      userRating: data.user_rating,
    };
  } catch {
    return { average: 0, count: 0, userRating: null };
  }
}

export async function submitCourseRating(
  slug: string,
  rating: number
): Promise<CourseRatingResponse> {
  const res = await fetch(`${API_BASE_URL}/courses/${slug}/rating`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: "anonymous_user", rating }),
  });

  if (!res.ok) {
    throw new Error("No se pudo guardar tu calificación");
  }

  return res.json();
}
