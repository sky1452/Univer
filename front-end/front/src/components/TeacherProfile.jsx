import React, { useState, useEffect, useRef } from "react";
import { API_URL } from "../config";
export function Datap() {
  const [user, setUser] = useState(
    () => JSON.parse(localStorage.getItem("user")) || {},
  );
  const [experience, setExperience] = useState("");
  const [dop, setDop] = useState("");
  const [avatar, setAvatar] = useState(user.avatar || "");
  const [disciplines, setDisciplines] = useState([]);
  const [openDiscipline, setOpenDiscipline] = useState(false);

  const [isExperienceChanged, setIsExperienceChanged] = useState(false);
  const [isDopChanged, setIsDopChanged] = useState(false);

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
              let id, name, type;
              if (d.lectureId) {
                id = d.lectureId;
                name = d.lectureName;
                type = "л.";
              } else if (d.labId) {
                id = d.labId;
                name = d.labName;
                type = "лаб.";
              } else if (d.practicId) {
                id = d.practicId;
                name = d.practicName;
                type = "пр.";
              }
              return { id, name, type };
            })
            .filter((d) => d.name);

          const uniqueDisciplines = Array.from(
            new Map(mapped.map((d) => [d.name + d.type, d])).values(),
          );

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
    if (user) {
      if (user.stazh != null) setExperience(String(user.stazh));
      if (user.dop != null) setDop(user.dop);
      if (user.avatar) setAvatar(user.avatar);
      setIsExperienceChanged(false);
      setIsDopChanged(false);
    }
  }, [user]);

  const handleSaveStazh = async () => {
    try {
      const response = await fetch(`${API_URL}/api/update-user`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: user.fullName,
          stazh: Number(experience),
        }),
      });
      if (response.ok) {
        const updatedUser = { ...user, stazh: Number(experience) };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        alert("Стаж сохранён");
        setIsExperienceChanged(false);
      } else {
        console.error("Ошибка при сохранении стажа");
      }
    } catch (err) {
      console.error("Ошибка сети", err);
    }
  };

  function getYearWord(num) {
    num = Math.abs(num) % 100;
    const lastDigit = num % 10;
    if (num > 10 && num < 20) return "лет";
    if (lastDigit === 1) return "год";
    if (lastDigit >= 2 && lastDigit <= 4) return "года";
    return "лет";
  }

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
        setIsDopChanged(false);
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
          alert("Фотография сохранена");
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
            <td>Личные данные:</td>
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
            <td>Должность:</td>
            <td>
              {user.position} <br /> {user.departament}
            </td>
          </tr>
          <tr>
            <td>Учебные дисциплины:</td>
            <td>
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
                          {d.name}, {d.type}
                        </div>
                      ))
                    ) : (
                      <div className="dropdown-item" style={{ color: "#999" }}>
                        Нет дисциплин
                      </div>
                    )}
                  </div>
                )}
              </div>
            </td>
          </tr>

          {/* --- СТАЖ --- */}
          <tr>
            <td>Стаж работы:</td>
            <td>
              <input
                type="number"
                style={{ width: "10%" }}
                value={experience}
                onChange={(e) => {
                  const val = e.target.value;
                  if (
                    val === "" ||
                    (/^\d{1,2}$/.test(val) && Number(val) >= 0)
                  ) {
                    setExperience(val);
                    setIsExperienceChanged(Number(val) !== user.stazh);
                  }
                }}
              />{" "}
              {experience !== "" ? getYearWord(Number(experience)) : ""}
              {isExperienceChanged && (
                <button
                  className="button_save"
                  onClick={handleSaveStazh}
                  style={{ marginLeft: "10px" }}
                >
                  Сохранить
                </button>
              )}
            </td>
          </tr>

          {/* --- ДОП. ИНФО --- */}
          <tr>
            <td>Дополнительно о себе:</td>
            <td>
              <input
                type="text"
                value={dop}
                onChange={(e) => {
                  setDop(e.target.value);
                  setIsDopChanged(e.target.value !== (user.dop || ""));
                }}
                placeholder="Краткая информация в вашем профиле(до 45 символов)"
                maxLength={45}
              />
              {isDopChanged && (
                <button className="button_save" onClick={handleSavedop}>
                  Сохранить
                </button>
              )}
            </td>
          </tr>

          <tr>
            <td>Обновить фотографию профиля:</td>
            <td>
              <input type="file" onChange={handleAvatarChange} />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
