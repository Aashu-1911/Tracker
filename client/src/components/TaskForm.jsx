import { useState } from "react";
import { useForm } from "react-hook-form";
import { formatISODate } from "../utils/dateUtils";
import styles from "./TaskForm.module.css";

const categories = ["work", "health", "personal", "learning", "other"];
const priorities = ["high", "medium", "low"];
const TITLE_MAX_LENGTH = 100;

const TaskForm = ({ onCreate }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      title: "",
      description: "",
      category: "work",
      priority: "medium",
      date: formatISODate(new Date()),
    },
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const onSubmit = async (data) => {
    setError("");
    setSuccess("");

    try {
      await onCreate({
        title: data.title.trim(),
        description: data.description.trim(),
        category: data.category,
        priority: data.priority,
        date: data.date,
      });
      setSuccess("Task created.");
      reset({
        title: "",
        description: "",
        category: "work",
        priority: "medium",
        date: formatISODate(new Date()),
      });
    } catch (err) {
      setError(err.message || "Unable to create task.");
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
      <div className={styles.header}>
        <div>
          <h3>Create a task</h3>
          <p>Capture what matters and keep your day on track.</p>
        </div>
        <button className={styles.submit} type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Add task"}
        </button>
      </div>

      <div className={styles.grid}>
        <label className={styles.field}>
          Title
          <input
            type="text"
            placeholder="Write a clear task"
            maxLength={TITLE_MAX_LENGTH}
            {...register("title", {
              validate: (value) => {
                const trimmedValue = value.trim();
                if (!trimmedValue) {
                  return "Title is required";
                }
                if (trimmedValue.length > TITLE_MAX_LENGTH) {
                  return `Title must be ${TITLE_MAX_LENGTH} characters or less`;
                }
                return true;
              },
            })}
          />
          {errors.title ? <span className={styles.error}>{errors.title.message}</span> : null}
        </label>

        <label className={styles.field}>
          Date
          <input type="date" {...register("date")} />
        </label>

        <label className={styles.field}>
          Category
          <select {...register("category")}>
            {categories.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          Priority
          <select {...register("priority")}>
            {priorities.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.fieldFull}>
          Description
          <textarea
            rows="3"
            placeholder="Add details or acceptance notes"
            {...register("description")}
          />
        </label>
      </div>

      {error ? <div className={styles.errorBanner}>{error}</div> : null}
      {success ? <div className={styles.success}>{success}</div> : null}
    </form>
  );
};

export default TaskForm;
