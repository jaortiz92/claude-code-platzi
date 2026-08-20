import { Class } from "@/types";
import { VideoPlayer } from "@/components/VideoPlayer/VideoPlayer";
import Link from "next/link";
import styles from "./page.module.scss";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ClassPageProps {
  params: { slug: string; class_id: string };
}

async function getClassData(slug: string, class_id: string): Promise<Class> {
  const res = await fetch(`${API_BASE_URL}/courses/${slug}/classes/${class_id}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("No se pudo cargar la clase");
  return res.json();
}

export default async function ClassPage({ params }: ClassPageProps) {
  const { slug, class_id } = await params;
  const classData = await getClassData(slug, class_id);

  return (
    <main className={styles.container}>
      <VideoPlayer src={classData.video} title={classData.title} />
      <h1 className={styles.title}>{classData.title}</h1>
      <p className={styles.description}>{classData.description}</p>
      <Link href={`/course/${slug}`} className={styles.backButton}>
        ← Regresar al curso
      </Link>
    </main>
  );
}
