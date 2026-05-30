import React, { useState, useEffect, useRef } from "react";
import { API_URL } from "../config";
const datap = [
  { name: "Личные данные: ", id: 1 },
  { name: "Учебная группа: ", id: 2 },
  { name: "Учебные дисциплины: ", id: 3 },
  { name: "Стаж работы: ", id: 4 },
  { name: "Дополнительно о себе: ", id: 5 },
  { name: "Обновить фотографию профиля: ", id: 6 },
];

export function DatapStudent() {
  const [user, setUser] = useState(
    () => JSON.parse(localStorage.getItem("user")) || {},
  );
  const [dop, setDop] = useState("");
  const [avatar, setAvatar] = useState(user.avatar || "");
  const [disciplines, setDisciplines] = useState([]);
  const [openDiscipline, setOpenDiscipline] = useState(false);
  const [group, setGroup] = useState("");
  const disciplineRef = useRef(null);

  useEffect(() => {
    if (!user?.userId) return;
    const fetchDisciplines = async () => {
      try {
        const res = await fetch(`${API_URL}/mySchedule/${user.userId}`);
        if (res.ok) {
          const data = await res.json();

          const mapped = data
            .map((d) => {
              let id, name;
              if (d.lectureId) {
                id = d.lectureId;
                name = d.lectureName;
              } else if (d.labId) {
                id = d.labId;
                name = d.labName;
              } else if (d.practicId) {
                id = d.practicId;
                name = d.practicName;
              }
              return { id, name };
            })
            .filter((d) => d.name);

          // уникальные дисциплины только по имени
          const uniqueDisciplines = Array.from(
            new Map(mapped.map((d) => [d.name, d])).values(),
          );

          // сортировка по алфавиту
          uniqueDisciplines.sort((a, b) => a.name.localeCompare(b.name));

          setDisciplines(uniqueDisciplines);
        } else {
          console.error("Ошибка при загрузке дисциплин");
        }
      } catch (err) {
        console.error("Ошибка сети при загрузке дисциплин", err);
      }
    };
    fetchDisciplines();
  }, [user]);

  useEffect(() => {
    if (!user?.userId) return;

    const savedGroup = localStorage.getItem(`group_${user.userId}`);
    if (savedGroup) {
      setGroup(savedGroup);
      return;
    }

    const fetchGroup = async () => {
      try {
        const res = await fetch(`${API_URL}/myGroup/${user.userId}`);
        if (res.ok) {
          const data = await res.json();
          const groupName = data.Name || "";
          setGroup(groupName);
          localStorage.setItem(`group_${user.userId}`, groupName);
        } else {
          console.error("Ошибка при загрузке группы студента");
        }
      } catch (err) {
        console.error("Ошибка сети при загрузке группы студента", err);
      }
    };
    fetchGroup();
  }, [user]);

  useEffect(() => {
    if (user) {
      if (user.dop != null) setDop(user.dop);
      if (user.avatar) setAvatar(user.avatar);
    }
  }, [user]);

  const handleSavedop = async () => {
    try {
      const response = await fetch(`${API_URL}/api/update-dop`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: user.fullName, dop }),
      });
      if (response.ok) {
        const updatedUser = { ...user, dop };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        alert("Информация о себе сохранена");
      } else {
        console.error("Ошибка при изменении информации о себе");
      }
    } catch (err) {
      console.error("Ошибка сети", err);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Файл слишком большой. Максимум 5МБ");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result.split(",")[1];
      try {
        const response = await fetch(`${API_URL}/api/update-avatar`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: user.fullName, avatar: base64 }),
        });
        if (response.ok) {
          const updatedUser = { ...user, avatar: reader.result };
          localStorage.setItem("user", JSON.stringify(updatedUser));
          setUser(updatedUser);
          setAvatar(reader.result);
          alert("Аватарка обновлена");
        } else {
          alert("Ошибка при загрузке аватарки");
        }
      } catch (err) {
        console.error(err);
        alert("Ошибка сети");
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        disciplineRef.current &&
        !disciplineRef.current.contains(event.target)
      ) {
        setOpenDiscipline(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (user.role === "admin") {
    return <div>Профиль доступен только для преподавателя</div>;
  }

  return (
    <div className="profilt show">
      <table className="data-table">
        <tbody>
          <tr>
            <td colSpan={3}>Моя страница:</td>
          </tr>
          <tr>
            <td>{datap[0].name}</td>
            <td>
              {user.fullName} <br />
              {user.email}
            </td>
            <td align="center">
              <img
                src={avatar}
                alt=""
                style={{ maxWidth: "256px", maxHeight: "256px" }}
              />
            </td>
          </tr>
          <tr>
            <td>{datap[1].name}</td>
            <td>{group}</td>
          </tr>
          <tr>
            <td>{datap[2].name}</td>
            <td>
              <div>
                <div className="dropdown" ref={disciplineRef}>
                  <div
                    className="button_progress1"
                    onClick={() => setOpenDiscipline(!openDiscipline)}
                    style={{ textAlign: "center" }}
                  >
                    Дисциплины
                  </div>
                  {openDiscipline && (
                    <div
                      className="dropdown-menu"
                      style={{ textAlign: "center" }}
                    >
                      {disciplines.length > 0 ? (
                        disciplines.map((d) => (
                          <div key={d.id} className="dropdown-item">
                            {d.name}
                          </div>
                        ))
                      ) : (
                        <div
                          className="dropdown-item"
                          style={{ color: "#999", textAlign: "center" }}
                        >
                          Нет дисциплин
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </td>
          </tr>
          <tr>
            <td>{datap[4].name}</td>
            <td>
              <input
                type="text"
                value={dop}
                onChange={(e) => setDop(e.target.value)}
                placeholder="Краткая информация в вашем профиле(до 45 символов)"
                maxLength={45}
              />
              <button className="button_save" onClick={handleSavedop}>
                Сохранить
              </button>
            </td>
          </tr>
          <tr>
            <td>{datap[5].name}</td>
            <td>
              <input type="file" onChange={handleAvatarChange} />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
