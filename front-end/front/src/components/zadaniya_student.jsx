import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";
export function HomeworkStudentPage() {
  const navigate = useNavigate();

  const [discipline, setDiscipline] = useState([]);
  const [recentCourses, setRecentCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.userId;

  useEffect(() => {
    setLoading(true);

    if (!userId) {
      setLoading(false);
      return;
    }

    fetch(`${API_URL}/mySchedule/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        const IdSlugName = new Map();

        data.forEach((item) => {
          if (!IdSlugName.has(item.disciplineId)) {
            IdSlugName.set(item.disciplineId, {
              id: item.disciplineId,
              slug: item.disciplineSlug,
              name: item.labName || item.practicName || item.lectureName,
            });
          }
        });

        const ISN = Array.from(IdSlugName.values()).sort((a, b) =>
          a.name.localeCompare(b.name, "ru"),
        );

        setDiscipline(ISN);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Ошибка при загрузке дисциплин:", error);
        setLoading(false);
      });
  }, [userId]);

  // загрузка недавно посещённых (с учётом userId)
  useEffect(() => {
    if (!userId) {
      setRecentCourses([]);
      return;
    }

    const storageKey = `recentCourses_${userId}`;
    const stored = JSON.parse(localStorage.getItem(storageKey)) || [];

    setRecentCourses(stored);
  }, [userId]);

  if (loading) return <p>Загрузка дисципилин...</p>;

  return (
    <div className="progresst">
      Мои задания
      <div>
        <div style={{ textAlign: "left", fontSize: "20px", marginTop: "4%" }}>
          Ваши недавно посещённые курсы:
        </div>

        <table className="data-table1">
          <thead>
            <tr></tr>
          </thead>
          <tbody>
            <tr>
              {[...recentCourses, ...Array(4 - recentCourses.length)].map(
                (course, i) => (
                  <td key={i}>
                    {course ? (
                      <div
                        className="square"
                        onClick={() =>
                          navigate(
                            `/homework_student/${course.id}/${course.slug}`,
                          )
                        }
                      ></div>
                    ) : (
                      <div className="square"></div>
                    )}
                  </td>
                ),
              )}
            </tr>

            <tr>
              {[...recentCourses, ...Array(4 - recentCourses.length)].map(
                (course, i) => (
                  <td key={i}>{course ? course.name : ""}</td>
                ),
              )}
            </tr>
          </tbody>
        </table>
      </div>
      {discipline.length === 0 ? (
        <p>Нет дисциплин для отображения</p>
      ) : (
        <div
          style={{ textAlign: "left", fontSize: "20px", marginTop: "4%" }}
          className="courses"
        >
          Выберите курс:
          {discipline.map((coures) => (
            <p
              key={coures.id}
              className="course-item"
              onClick={() => {
                const storageKey = `recentCourses_${userId}`;
                const recent =
                  JSON.parse(localStorage.getItem(storageKey)) || [];

                const newCourse = {
                  id: coures.id,
                  slug: coures.slug,
                  name: coures.name,
                };

                const filtered = recent.filter((c) => c.id !== newCourse.id);
                const updated = [newCourse, ...filtered].slice(0, 4);

                localStorage.setItem(storageKey, JSON.stringify(updated));
                setRecentCourses(updated);

                navigate(`/homework_student/${coures.id}/${coures.slug}`);
              }}
            >
              {coures.name}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
