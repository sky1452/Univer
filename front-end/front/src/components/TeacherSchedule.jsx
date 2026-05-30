import React, { useEffect, useState } from "react";
import { Day } from "./Day";
import { API_URL } from "../config";
export function SchedulePage() {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.userId;

  const daysOfWeek = [
    { id: 1, title: "ПОНЕДЕЛЬНИК" },
    { id: 2, title: "ВТОРНИК" },
    { id: 3, title: "СРЕДА" },
    { id: 4, title: "ЧЕТВЕРГ" },
    { id: 5, title: "ПЯТНИЦА" },
    { id: 6, title: "СУББОТА" },
  ];

  useEffect(() => {
    if (!userId) return;

    fetch(`${API_URL}/mySchedule/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setSchedule(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [userId]);

  if (loading) return <p>Загрузка расписания...</p>;

  return (
    <div className="schedulet">
      <div className="grid-container">
        {daysOfWeek.map((day) => {
          //пары для конкретного дня
          const dayData = schedule.filter((para) => para.dayOfWeek === day.id);
          return <Day key={day.id} title={day.title} data={dayData} />;
        })}
      </div>
    </div>
  );
}
