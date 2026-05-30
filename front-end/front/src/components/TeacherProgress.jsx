import { useState, useEffect, useRef } from "react";
import { API_URL } from "../config";
export function ProgressPage() {
  const [openGroup, setOpenGroup] = useState(false);
  const [openDiscipline, setOpenDiscipline] = useState(false);

  const [groups, setGroups] = useState([]);
  const [disciplines, setDisciplines] = useState([]);
  const [mapping, setMapping] = useState({});

  const [students, setStudents] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedDiscipline, setSelectedDiscipline] = useState(null);

  const groupRef = useRef(null);
  const disciplineRef = useRef(null);

  const [grades, setGrades] = useState({});
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [initialGrades, setInitialGrades] = useState({});

  useEffect(() => {
    async function fetchSchedule() {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        const teacherId = user?.userId;
        const res = await fetch(`${API_URL}/mySchedule/${teacherId}`);
        const data = await res.json();

        const teacherData = data.filter((item) =>
          item.teacherIds.includes(teacherId),
        );

        const groupToDisc = {};
        const discToGroup = {};

        teacherData.forEach((item) => {
          const group = item.groupName;

          // Берём все дисциплины одного предмета
          const disciplinesArray = [
            item.lectureName,
            item.labName,
            item.practicName,
          ].filter(Boolean);

          if (!groupToDisc[group]) groupToDisc[group] = [];

          disciplinesArray.forEach((name) => {
            // Добавляем только уникальные по имени
            if (!groupToDisc[group].some((d) => d.name === name)) {
              const id = item.lectureId || item.labId || item.practicId;
              groupToDisc[group].push({ id, name });
            }

            if (!discToGroup[name]) discToGroup[name] = [];
            if (!discToGroup[name].includes(group))
              discToGroup[name].push(group);
          });
        });

        // Уникальные дисциплины для всего списка
        const uniqueDisciplinesMap = new Map();
        Object.values(groupToDisc)
          .flat()
          .forEach((d) => {
            if (!uniqueDisciplinesMap.has(d.name))
              uniqueDisciplinesMap.set(d.name, d);
          });
        const uniqueDisciplines = Array.from(
          uniqueDisciplinesMap.values(),
        ).sort((a, b) => a.name.localeCompare(b.name));

        setGroups(Object.keys(groupToDisc).sort());
        setDisciplines(uniqueDisciplines);
        setMapping({ groupToDisc, discToGroup });
      } catch (err) {
        console.error("Ошибка загрузки расписания:", err);
      }
    }

    fetchSchedule();
  }, []);

  async function fetchGroupStudents(groupName) {
    if (!groupName) return;
    try {
      const res = await fetch(
        `${API_URL}/students/${encodeURIComponent(groupName)}`,
      );
      const data = await res.json();
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchGrades(groupName, disciplineId) {
    if (!groupName || !disciplineId) return;
    try {
      const res = await fetch(
        `${API_URL}/grades/${encodeURIComponent(groupName)}/${disciplineId}`,
      );
      const data = await res.json();

      const loadedGrades = {};
      data.forEach((g) => {
        if (!loadedGrades[g.student_id]) loadedGrades[g.student_id] = {};
        loadedGrades[g.student_id][g.module_number] = g.score;
      });

      setGrades(loadedGrades);
      setInitialGrades(loadedGrades); // сохраняем "оригинал"
      setUnsavedChanges(false);
    } catch (err) {
      console.error("Ошибка загрузки оценок:", err);
    }
  }

  useEffect(() => {
    const changed = students.some((s) => {
      const studentGrades = grades[s.id] || {};
      const initialStudentGrades = initialGrades[s.id] || {};
      return [1, 2, 3, 4].some((m) => {
        const current = studentGrades[m] ? parseInt(studentGrades[m]) : 0;
        const initial = initialStudentGrades[m]
          ? parseInt(initialStudentGrades[m])
          : 0;
        return current !== initial;
      });
    });
    setUnsavedChanges(changed);
  }, [grades, students, initialGrades]);

  useEffect(() => {
    if (selectedGroup) fetchGroupStudents(selectedGroup);
    else setStudents([]);
  }, [selectedGroup]);

  useEffect(() => {
    if (selectedGroup && selectedDiscipline?.id) {
      fetchGrades(selectedGroup, selectedDiscipline.id);
    } else {
      setGrades({});
    }
  }, [selectedGroup, selectedDiscipline]);

  const availableDisciplines = selectedGroup
    ? mapping.groupToDisc?.[selectedGroup] || []
    : disciplines;

  const availableGroups = selectedDiscipline
    ? mapping.discToGroup?.[selectedDiscipline.name] || []
    : groups;

  useEffect(() => {
    function handleClickOutside(event) {
      if (groupRef.current && !groupRef.current.contains(event.target))
        setOpenGroup(false);
      if (
        disciplineRef.current &&
        !disciplineRef.current.contains(event.target)
      )
        setOpenDiscipline(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleGradeChange = (studentId, moduleNumber, value) => {
    if (value.length > 3) return;
    if (value && isNaN(value)) return;

    setGrades((prev) => {
      const newGrades = {
        ...prev,
        [studentId]: { ...prev[studentId], [moduleNumber]: value },
      };
      if (Object.values(newGrades[studentId]).every((v) => !v))
        delete newGrades[studentId];
      setUnsavedChanges(Object.keys(newGrades).length > 0);
      return newGrades;
    });
  };

  const saveGrades = async () => {
    if (!selectedGroup || !selectedDiscipline?.id) {
      alert("Выберите группу и дисциплину перед сохранением!");
      return;
    }

    const payload = [];
    for (const studentId in grades) {
      for (const moduleNumber in grades[studentId]) {
        payload.push({
          student_id: parseInt(studentId),
          group_name: selectedGroup,
          discipline_id: parseInt(selectedDiscipline.id),
          discipline_type: selectedDiscipline.name,
          module_number: parseInt(moduleNumber),
          score: grades[studentId][moduleNumber]
            ? parseInt(grades[studentId][moduleNumber])
            : null,
        });
      }
    }

    if (payload.length === 0) {
      alert("Нет изменений для сохранения!");
      return;
    }

    console.log("Payload to send:", payload);

    try {
      await fetch(`${API_URL}/grades`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setUnsavedChanges(false);
      alert("Оценки успешно сохранены!");
    } catch (err) {
      console.error("Ошибка сохранения оценок:", err);
      alert("Ошибка при сохранении оценок");
    }
  };

  return (
    <div className="progresst">
      Сформировать успеваемость
      <div className="progress-buttons">
        <div className="dropdown" ref={groupRef}>
          <div
            className="button_progress2"
            onClick={() => setOpenGroup(!openGroup)}
          >
            {selectedGroup || "Выбрать группу"}
            {selectedGroup && (
              <span
                className="clear-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedGroup(null);
                  setInitialGrades({});
                  setStudents([]);
                  setGrades({});
                }}
              >
                ✕
              </span>
            )}
          </div>
          {openGroup && (
            <div className="dropdown-menu">
              {availableGroups.map((g) => (
                <div
                  key={g}
                  className="dropdown-item"
                  onClick={() => {
                    setSelectedGroup(g);
                    setOpenGroup(false);
                    // Сравниваем по имени, чтобы дисциплина не пропадала
                    if (
                      selectedDiscipline &&
                      !mapping.groupToDisc?.[g]?.some(
                        (d) => d.name === selectedDiscipline.name,
                      )
                    ) {
                      setSelectedDiscipline(null);
                    }
                  }}
                >
                  {g}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="discipline-save-wrapper">
          <div className="dropdown" ref={disciplineRef}>
            <div
              className="button_progress2"
              onClick={() => setOpenDiscipline(!openDiscipline)}
            >
              {selectedDiscipline?.name || "Выбрать дисциплину"}
              {selectedDiscipline && (
                <span
                  className="clear-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setInitialGrades({});
                    setSelectedDiscipline(null);
                    setGrades({});
                  }}
                >
                  ✕
                </span>
              )}
            </div>
            {openDiscipline && (
              <div className="dropdown-menu">
                {availableDisciplines.map((d) => (
                  <div
                    key={d.id}
                    className="dropdown-item"
                    onClick={() => {
                      setSelectedDiscipline({ id: d.id, name: d.name });
                      setOpenDiscipline(false);
                      // Сравниваем по имени, чтобы группа не пропадала
                      if (
                        selectedGroup &&
                        !mapping.groupToDisc?.[selectedGroup]?.some(
                          (dd) => dd.name === d.name,
                        )
                      ) {
                        setSelectedGroup(null);
                      }
                    }}
                  >
                    {d.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {unsavedChanges && (
            <button onClick={saveGrades} className="button_save">
              Сохранить
            </button>
          )}
        </div>
      </div>
      {selectedGroup && selectedDiscipline && students?.length > 0 && (
        <table className="students-table">
          <thead>
            <tr>
              <th>№</th>
              <th>ФИО</th>
              <th>1-й модуль</th>
              <th>2-й модуль</th>
              <th>3-й модуль</th>
              <th>Экзамен</th>
              <th>Итого</th>
            </tr>
          </thead>
          <tbody>
            {students
              .slice()
              .sort((a, b) => a.username.localeCompare(b.username))
              .map((s, index) => {
                const studentGrades = grades[s.id] || {};
                const total = [1, 2, 3, 4]
                  .map((m) => parseInt(studentGrades[m]) || 0)
                  .reduce((a, b) => a + b, 0);

                return (
                  <tr key={s.id}>
                    <td>{index + 1}</td>
                    <td>{s.username}</td>
                    {[1, 2, 3, 4].map((module) => (
                      <td key={module}>
                        <input
                          type="text"
                          maxLength={3}
                          value={studentGrades[module] || ""}
                          onChange={(e) =>
                            handleGradeChange(s.id, module, e.target.value)
                          }
                          style={{
                            width: "100% ",
                            textAlign: "center",
                            border: "none",
                          }}
                        />
                      </td>
                    ))}
                    <td>{total}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      )}
    </div>
  );
}
