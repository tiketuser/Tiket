import { Calendar } from "@/components/ui/calendar";
const [date, setDate] = React.useState<Date | undefined>(new Date());
import React from "react";

const CustomDateInput = () => {
  return (
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      className="rounded-md border"
    />
  );
};

export default CustomDateInput;
