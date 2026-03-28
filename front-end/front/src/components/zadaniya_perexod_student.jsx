import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { fetchDiscipline, fetchStudentTasks } from "./api";

export function HomeworkStudentPage_id() {
  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.userId;

  const { disciplineId, disciplineSlug } = useParams();
  const navigate = useNavigate();

  const {data: disciplineData, isLoading: disciplineLoading} = useQuery({
    queryKey: ["discipline", disciplineId],
    queryFn: () => fetchDiscipline(disciplineId),
    enabled: !!userId,
  })

  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ["tasks", disciplineId, userId],
    queryFn: () => fetchStudentTasks(disciplineId, userId),
    enabled: !!userId,
    refetchInterval: 1000,
  });
  const tasks = tasksData?.tasks || [];
  const nearestDeadline =
    tasks.length > 0
      ? new Date(Math.min(...tasks.map(t => new Date(t.deadline).getTime())))
      : null;

  if (disciplineLoading || tasksLoading) return <p>Загрузка...</p>;

  return (
    <div className="zadaniya_main">

  <div style={{textAlign:"center"}}>
    Мои задания
  </div>

  <div className="course-header">
    Название курса: {disciplineData?.name}
  </div>
  <div className="course-header">
    Ближайший дедлайн:{" "}
        {nearestDeadline
    ? nearestDeadline.toLocaleString("ru-RU", {
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
);
}
/*import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";


export function HomeworkStudentPage_id(){


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

  fetch(`http://localhost:8081/discipline/${disciplineId}`)
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

  fetch(`http://localhost:8081/discipline/${disciplineId}/student/${userId}`)
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
    ? nearestDeadline.toLocaleString("ru-RU", {
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