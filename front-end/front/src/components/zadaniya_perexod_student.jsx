import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { fetchDiscipline, fetchStudentTasks, fetchProgress } from "./api";
import { DateTime } from "luxon";

export function HomeworkStudentPageId() {
  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.userId;

  const { disciplineId, disciplineSlug } = useParams();
  const navigate = useNavigate();

  const { data: disciplineData, isLoading: disciplineLoading } = useQuery({
    queryKey: ["discipline", disciplineId],
    queryFn: () => fetchDiscipline(disciplineId),
    enabled: !!userId,
  });

  const { data: progress, isLoading: progressLoading } = useQuery({
    queryKey: ["progress", userId, disciplineId],
    queryFn: () => fetchProgress(userId, disciplineId),
    enabled: !!userId,
    refetchInterval: 1000,
  });

  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ["tasks", disciplineId, userId],
    queryFn: () => fetchStudentTasks(disciplineId, userId),
    enabled: !!userId,
    refetchInterval: 1000,
  });

  const now = DateTime.local(); // Получаем текущее время в локальной временной зоне

  const tasks = tasksData?.tasks || [];

  const futureDeadlines = tasks
    .map((t) => {
      // Печатаем данные для отладки, чтобы понять, как выглядит дата
      console.log("Raw Deadline:", t.deadline);

      // Используем fromISO для корректного парсинга строки в ISO-формате
      const deadline = DateTime.fromISO(t.deadline);

      if (!deadline.isValid) {
        console.error(`Invalid deadline for task: ${t.title}`, t.deadline);
      }

      // Печатаем результат после преобразования
      console.log(`Parsed Deadline for task "${t.title}":`, deadline.toISO());

      // Преобразуем в локальное время, если дата валидна
      return deadline.isValid ? deadline.toLocal() : null;
    })
    .filter((time) => time && time > now); // Фильтруем только те дедлайны, которые позже текущего времени

  // Логируем все будущие дедлайны
  console.log("Filtered Future Deadlines:", futureDeadlines);

  // Определяем ближайший дедлайн, если есть
  const nearestDeadline =
    futureDeadlines.length > 0
      ? futureDeadlines.reduce((a, b) => (a < b ? a : b)) // Находим ближайший дедлайн
      : null;

  // Логируем ближайший дедлайн
  console.log("Nearest Deadline:", nearestDeadline);

  if (disciplineLoading || tasksLoading || progressLoading) {
    return <p>Загрузка страницы дисциплины...</p>;
  }

  return (
    <div className="zadaniya_main">
      <div style={{ textAlign: "center" }}>Мои задания</div>

      <div className="course-header">
        Название курса: {disciplineData?.name}
      </div>
      <div className="course-header">
        Ближайший крайний срок сдачи одной из работ:{" "}
        {nearestDeadline
          ? nearestDeadline.toLocaleString(DateTime.DATETIME_MED) // Форматируем дату в понятный формат
          : "Задания отсутствуют"}
      </div>
      <div className="course-header">
        Прогресс: {progress?.progress || 0}/
        {tasks && tasks.length > 0 ? tasks.length : "Задания отсутствуют"}
      </div>
      <div className="zadaniyes">
        Задания данного курса:
        <div className="zadaniya-list">
          {tasks && tasks.length > 0 ? (
            tasks.map((t) => (
              <div
                className="zadaniye"
                key={t.id}
                onClick={() =>
                  navigate(
                    `/homework_student/${disciplineId}/${disciplineSlug}/${t.id}`,
                  )
                }
              >
                {t.title}
              </div>
            ))
          ) : (
            <div>
              У вас пока нет созданных заданий в этой дисциплине и группе.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
/*import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";


export function HomeworkStudentPageId(){


const [loading, setLoading] = useState(true);
const user = JSON.parse(localStorage.getItem("user"));
const userId = user?.userId;
const { disciplineId } = useParams();
const { disciplineSlug } = useParams();
const navigate = useNavigate();

const [discipline, setDiscipline] = useState(null);
const [tasks, setTasks] = useState([]);

useEffect(() => {

  setLoading(true);

  if (!userId){
    setLoading(false);
    return;
  }

  fetch(`${API_URL}/discipline/${disciplineId}`)
    .then(res => res.json())
    .then(data => {
      setDiscipline(data.name);
      setLoading(false);
    })
    .catch(error => {
      console.error("Ошибка при загрузке дисциплины:", error);
    });

}, [disciplineId, userId]);

useEffect(() => {

  setLoading(true);

  if (!userId){
    setLoading(false);
    return;
  }

  fetch(`${API_URL}/discipline/${disciplineId}/student/${userId}`)
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        console.error("Server error:", data.error);
        setTasks([]); 
      } else if (Array.isArray(data.tasks)) {
        setTasks(data.tasks); 
        console.log("Задания для студента:", data.tasks);
      } 
      setLoading(false);
    })
    .catch(err => {
      console.error("Ошибка при загрузке заданий студента:", err);
      setTasks([]);
      setLoading(false);
    });
}, [disciplineId, userId]);

const nearestDeadline =
  tasks && tasks.length > 0
    ? new Date(Math.min(...tasks.map(t => new Date(t.deadline).getTime())))
    : null;

if (loading) return <p>Загрузка страницы дисциплины...</p>;

return (

<div className="zadaniya_main">

  <div style={{textAlign:"center"}}>
    Мои задания
  </div>

  <div className="course-header">
    Название курса: {discipline}
  </div>
  <div className="course-header">
    Ближайший дедлайн:{" "}
        {nearestDeadline
    ? nearestDeadline.toLocaleString("ru-RU`, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Задания отсутствуют"}
  </div>
  <div className="course-header">
    Прогресс: /{tasks && tasks.length > 0 ?  tasks.length : "Задания отсутствуют"}
  </div>
  <div className="zadaniyes">
  Задания данного курса:
  <div className="zadaniya-list">
  {tasks && tasks.length > 0 ? (
    tasks.map((t) => (
      <div className="zadaniye" key={t.id} onClick={() => 
            navigate(`/homework_student/${disciplineId}/${disciplineSlug}/${t.id}`)
           }>{t.title}</div>
    ))
  ) : (
    <div >У вас пока нет созданных заданий в этой дисциплине и группе.</div>
  )}
</div>
  </div>
  </div>
)
}*/
