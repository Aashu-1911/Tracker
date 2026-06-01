import { format, addDays } from "date-fns";

export const formatISODate = (date) => format(date, "yyyy-MM-dd");

export const formatShortDate = (date) => {
  if (!date) {
    return "";
  }
  return format(new Date(date), "MMM d");
};

export const shiftDateBy = (date, days) => addDays(date, days);

export const isSameDay = (left, right) =>
  formatISODate(new Date(left)) === formatISODate(new Date(right));
