import { notFound } from "next/navigation";
import { CourseDetail } from "@/types";
import { CourseDetailComponent } from "@/components/CourseDetail/CourseDetail";
import { getCourseRating } from "@/services/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface CoursePageProps {
  params: {
    slug: string;
  };
}

async function getCourseData(slug: string): Promise<CourseDetail> {
  const response = await fetch(`${API_BASE_URL}/courses/${slug}`, {
    cache: "no-store",
  });

  if (response.status === 404) {
    notFound();
  }

  if (!response.ok) {
    throw new Error("Failed to fetch course data");
  }

  return response.json();
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { slug } = await params;
  const [courseData, rating] = await Promise.all([
    getCourseData(slug),
    getCourseRating(slug),
  ]);

  return (
    <CourseDetailComponent course={courseData} rating={rating} slug={slug} />
  );
}

export async function generateMetadata({ params }: CoursePageProps) {
  const { slug } = await params;
  const courseData = await getCourseData(slug);

  return {
    title: `${courseData.title} - Curso Online`,
    description: courseData.description,
  };
}
