"use client";

import { useState, useTransition } from "react";
import { submitCourseRating } from "@/services/api";
import styles from "./StarRatingInteractive.module.scss";

interface StarRatingInteractiveProps {
  slug: string;
  initialUserRating: number | null;
  onRatingSubmitted?: (newAverage: number, newCount: number) => void;
}

export const StarRatingInteractive = ({
  slug,
  initialUserRating,
  onRatingSubmitted,
}: StarRatingInteractiveProps) => {
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [userRating, setUserRating] = useState<number | null>(initialUserRating);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const activeRating = hoveredStar ?? userRating;

  const handleClick = (rating: number) => {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        await submitCourseRating(slug, rating);
        setUserRating(rating);
        setSuccess(`Calificaste con ${rating} estrella${rating !== 1 ? "s" : ""}`);
        onRatingSubmitted?.(rating, 1);
      } catch {
        setError("No se pudo guardar tu calificación");
      }
    });
  };

  return (
    <div className={styles.container}>
      <p className={styles.label}>Califica este curso:</p>
      <div className={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`${styles.starButton} ${
              activeRating !== null && star <= activeRating ? styles.active : ""
            }`}
            onMouseEnter={() => setHoveredStar(star)}
            onMouseLeave={() => setHoveredStar(null)}
            onClick={() => handleClick(star)}
            disabled={isPending}
            aria-label={`Calificar con ${star} estrella${star !== 1 ? "s" : ""}`}
          >
            ★
          </button>
        ))}
      </div>
      {isPending && <p className={styles.pending}>Guardando...</p>}
      {success && <p className={styles.success}>{success}</p>}
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
};
