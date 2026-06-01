import { useState } from "react";
import { formatISODate, shiftDateBy } from "../utils/dateUtils";

const useDate = (initialDate = new Date()) => {
  const [selectedDate, setSelectedDate] = useState(initialDate);

  const setDateFromInput = (value) => {
    const next = value ? new Date(value) : new Date();
    setSelectedDate(next);
  };

  const goNextDay = () => setSelectedDate((prev) => shiftDateBy(prev, 1));
  const goPrevDay = () => setSelectedDate((prev) => shiftDateBy(prev, -1));

  return {
    selectedDate,
    setSelectedDate,
    setDateFromInput,
    goNextDay,
    goPrevDay,
    formattedDate: formatISODate(selectedDate),
  };
};

export default useDate;
