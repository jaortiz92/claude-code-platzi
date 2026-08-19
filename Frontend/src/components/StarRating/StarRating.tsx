import styles from "./StarRating.module.scss";

interface StarRatingProps {
  average: number;
  count: number;
  size?: "sm" | "md" | "lg";
}

export const StarRating = ({ average, count, size = "md" }: StarRatingProps) => {
  const stars = Array.from({ length: 5 }, (_, i) => {
    const starIndex = i + 1;
    if (average >= starIndex) return "full";
    if (average >= starIndex - 0.5) return "half";
    return "empty";
  });

  return (
    <div
      className={`${styles.starRating} ${styles[size]}`}
      role="img"
      aria-label={`Promedio: ${average.toFixed(1)} de 5 estrellas, ${count} calificaciones`}
    >
      {stars.map((type, index) => (
        <span key={index} className={`${styles.star} ${styles[type]}`}>
          <span className={styles.starIcon}>★</span>
          {type === "half" && (
            <span className={`${styles.starIcon} ${styles.halfOverlay}`}>★</span>
          )}
        </span>
      ))}
      {count > 0 && <span className={styles.count}>({count})</span>}
    </div>
  );
};
