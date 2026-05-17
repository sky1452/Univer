import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { CreateHomework } from "./CreateHomework.jsx";
import { ReceivedWorks } from "./GetHomework.jsx";
import { CreatedHomework } from "./CreatedHomework.jsx";
import { CheckHomework } from "./checkHomerk.jsx";

export function HomeworkPage_id() {
  const [mode, setMode] = useState(null);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.userId;

  const { disciplineId, group, homeworkId } = useParams();
  const navigate = useNavigate();
  const disciplineSlug = useParams().disciplineSlug;
  const [discipline, setDiscipline] = useState(null);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(
    group ? decodeURIComponent(group) : null,
  );

  useEffect(() => {
    setLoading(true);

    if (!userId) {
      setLoading(false);
      return;
    }

    fetch(`${API_URL}/discipline/${disciplineId}`)
      .then((res) => res.json())
      .then((data) => {
        setDiscipline(data.name);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Ошибка при загрузке дисциплины:", error);
      });
  }, [disciplineId, userId]);

  useEffect(() => {
    if (!userId || !disciplineId) {
      setLoading(false);
      return;
    }

    fetch(`${API_URL}/mySchedule/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        const filtered = data.filter(
          (item) => item.disciplineId === parseInt(disciplineId),
        );

        const uniqueGroups = [
          ...new Set(filtered.map((item) => item.groupName)),
        ];
        const sortedGroups = uniqueGroups.sort((a, b) =>
          a.localeCompare(b, "ru"),
        );

        setGroups(sortedGroups);
      })
      .catch((err) => console.error("Ошибка загрузки групп:", err));
  }, [userId, disciplineId]);

  useEffect(() => {
    if (group) {
      setSelectedGroup(decodeURIComponent(group));
    }
  }, [group]);

  useEffect(() => {
    if (homeworkId) {
      setMode("received");
    }
  }, [homeworkId]);

  const handleSelectGroup = (groupName) => {
    setSelectedGroup(groupName);
    setMode(null);

    navigate(`/homework_teacher/${disciplineId}/${disciplineSlug}`);
  };

  if (loading) return <p>Загрузка страницы дисциплины...</p>;

  return (
    <div className="progresst">
      <div style={{ textAlign: "center" }}>Управление работами</div>

      <div className="course-header">Название курса: {discipline}</div>

      <div className="data-grid">
        <div className="grid-label">Выберите группу:</div>

        <div className="grid-content">
          <div className="groups-container">
            {groups.map((groupName) => (
              <div
                key={groupName}
                className="groups"
                onClick={() => handleSelectGroup(groupName)}
              >
                {groupName}
              </div>
            ))}
          </div>
        </div>

        {selectedGroup && (
          <>
            <div className="grid-label">Выбранная группа: {selectedGroup}</div>

            <div className="grid-content">
              <div className="groups-container">
                <div className="groups" onClick={() => setMode("create")}>
                  Создать задание
                </div>
                <div className="groups" onClick={() => setMode("received")}>
                  Полученные работы
                </div>
                <div className="groups" onClick={() => setMode("created")}>
                  Созданные задания
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {mode === "create" && (
        <CreateHomework
          disciplineId={disciplineId}
          group={selectedGroup}
          userId={userId}
        />
      )}

      {mode === "received" && (
        <>
          <ReceivedWorks
            disciplineId={disciplineId}
            group={selectedGroup}
            userId={userId}
          />

          <CheckHomework
            disciplineId={disciplineId}
            group={selectedGroup}
            userId={userId}
            homeworkId={homeworkId}
          />
        </>
      )}

      {mode === "created" && (
        <CreatedHomework
          disciplineId={disciplineId}
          group={selectedGroup}
          userId={userId}
        />
      )}
    </div>
  );
}
