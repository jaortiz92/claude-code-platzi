import styles from "./Course.module.scss";
import { Course as CourseType, CourseRating } from "@/types";
import { StarRating } from "@/components/StarRating/StarRating";

type CourseProps = Omit<CourseType, "slug"> & {
  rating?: CourseRating;
};

export const Course = ({ id, title, teacher, duration, thumbnail, rating }: CourseProps) => {
  return (
    <article className={styles.courseCard}>
      <div className={styles.thumbnailContainer}>
        <img src={thumbnail} alt={title} className={styles.thumbnail} />
      </div>
      <div className={styles.courseInfo}>
        <h2 className={styles.courseTitle}>{title}</h2>
        <p className={styles.teacher}>Profesor: {teacher}</p>
        <p className={styles.duration}>Duración: {duration} minutos</p>
        {rating && rating.count > 0 && (
          <StarRating average={rating.average} count={rating.count} size="sm" />
        )}
      </div>
    </article>
  );
};
