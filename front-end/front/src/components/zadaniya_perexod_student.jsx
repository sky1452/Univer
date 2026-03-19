import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

import { CreateHomework } from './CreateHomework.jsx';
import { ReceivedWorks } from './GetHomework.jsx';
import { CreatedHomework } from './CreatedHomework.jsx';

export function HomeworkStudentPage_id(){
const [mode, setMode] = useState(null);

const [loading, setLoading] = useState(true);
const user = JSON.parse(localStorage.getItem("user"));
const userId = user?.userId;
const { disciplineId } = useParams();

const [discipline, setDiscipline] = useState(null);
const [groups, setGroups] = useState([]);
const [selectedGroup, setSelectedGroup] = useState(null);

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

  if (!userId || !disciplineId){
    setLoading(false);
    return;
  }

  fetch(`http://localhost:8081/mySchedule/${userId}`)
    .then(res => res.json())
    .then(data => {

      const filtered = data.filter(
        item => item.disciplineId === parseInt(disciplineId)
      );

      const uniqueGroups = [
        ...new Set(filtered.map(item => item.groupName))
      ];

      const Groups = uniqueGroups.sort((a,b)=>a.localeCompare(b,"ru"));

      setGroups(Groups);

    })
    .catch(err => console.error("Ошибка загрузки групп:", err));

}, [userId, disciplineId]);


if (loading) return <p>Загрузка страницы дисциплины...</p>;

return (

<div className="progresst">

  <div style={{textAlign:"center"}}>
    Проверка заданий
  </div>

  <div className="course-header">
    Название курса: {discipline}
  </div>

  <div className="data-grid">

    <div className="grid-label">
      Выберите группу:
    </div>

    <div className="grid-content">
      <div className="groups-container">
        {groups.map(group => (
          <div
            key={group}
            className="groups"
            onClick={()=>setSelectedGroup(group)}
          >
            {group}
          </div>
        ))}
      </div>
    </div>

    {selectedGroup && (
  <>
    <div className="grid-label">
      Выбранная группа: {selectedGroup}
    </div>

    <div className="grid-content">
      <div className="groups-container">
        <div className="groups" onClick={()=>setMode("create")}>
          Создать задание
        </div>
        <div className="groups" onClick={()=>setMode("received")}>
          Полученные работы
        </div>
        <div className="groups" onClick={()=>setMode("created")}>
          Созданные задания
        </div>
      </div>
    </div>
  </>
)}

  </div>
{mode === "create" &&(<CreateHomework disciplineId = {disciplineId} group = {selectedGroup} userId = {userId} />)}
{mode === "received" &&(<ReceivedWorks disciplineId = {disciplineId} group = {selectedGroup} userId = {userId} />)}
{mode === "created" &&(<CreatedHomework disciplineId = {disciplineId} group = {selectedGroup} userId = {userId} />)}
</div>

)
}