import { useState, useEffect } from "react";

export function ProgressPage_student() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const user = JSON.parse(localStorage.getItem("user"));
        const studentId = user?.userId;

        const scheduleRes = await fetch(`${API_URL}/mySchedule/${studentId}`, {
          headers: { "Content-Type": "application/json" },
          mode: "cors",
        });
        const scheduleRaw = await scheduleRes.json();

        const gradesRes = await fetch(`${API_URL}/studentGrades/${studentId}`, {
          headers: { "Content-Type": "application/json" },
          mode: "cors",
        });
        const gradesRaw = await gradesRes.json();

        const gradesMap = {};
        (Array.isArray(gradesRaw) ? gradesRaw : []).forEach((g) => {
          gradesMap[g.discipline_type] = g.modules ?? {};
        });

        const mergedMap = {};
        (Array.isArray(scheduleRaw) ? scheduleRaw : []).forEach((s) => {
          const name =
            s.lectureName ?? s.labName ?? s.practicName ?? `Дисциплина ${s.id}`;
          if (!mergedMap[name]) {
            const modules = gradesMap[name] ?? {};
            mergedMap[name] = {
              disciplineId: s.id,
              disciplineName: name,
              modules: {
                1: modules[1] ?? null,
                2: modules[2] ?? null,
                3: modules[3] ?? null,
                4: modules[4] ?? null,
              },
            };
          }
        });

        const sortedData = Object.values(mergedMap).sort((a, b) =>
          a.disciplineName.localeCompare(b.disciplineName, "ru"),
        );

        // === ДОБАВЛЕННЫЙ КОД ===
        // Изменяем нужные строки (нумерация с 1)
        if (sortedData[5]) {
          // 7-я строка
          sortedData[5].modules[1] = 30;
          sortedData[5].modules[2] = 30;
          sortedData[5].modules[3] = 40;
        }

        if (sortedData[7]) {
          // 9-я строка
          sortedData[7].modules[1] = 20;
          sortedData[7].modules[2] = 20;
          sortedData[7].modules[3] = 20;
        }

        if (sortedData[8]) {
          // 10-я строка
          sortedData[8].modules[1] = 0;
          sortedData[8].modules[2] = 0;
          sortedData[8].modules[3] = 91;
        }
        // === КОНЕЦ ДОБАВЛЕНИЯ ===

        setData(sortedData);
      } catch (err) {
        console.error(err);
        setError(err.message ?? "Неизвестная ошибка при загрузке данных");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) return <div className="progress_s">Загрузка...</div>;
  if (error)
    return (
      <div className="progress_s" style={{ color: "red" }}>
        Ошибка: {error}
      </div>
    );

  return (
    <div className="progress_s">
      <div style={{ textAlign: "left", fontSize: "20px" }}>Успеваемость:</div>
      {data.length === 0 ? (
        <div>По вашему аккаунту данных не найдено.</div>
      ) : (
        <>
          <table className="students-table1">
            <thead>
              <tr>
                <th>№</th>
                <th>Дисциплина</th>
                <th>1-й модуль</th>
                <th>2-й модуль</th>
                <th>3-й модуль</th>
                <th>Экзамен</th>
                <th>Итого</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => {
                const total = [1, 2, 3, 4].reduce((sum, m) => {
                  const v = Number(item.modules[m]);
                  return sum + (Number.isFinite(v) ? v : 0);
                }, 0);

                const display = (m) => item.modules[m] ?? "-";

                return (
                  <tr key={item.disciplineId}>
                    <td>{index + 1}</td>
                    <td>{item.disciplineName}</td>
                    <td style={{ textAlign: "center" }}>{display(1)}</td>
                    <td style={{ textAlign: "center" }}>{display(2)}</td>
                    <td style={{ textAlign: "center" }}>{display(3)}</td>
                    <td style={{ textAlign: "center" }}>{display(4)}</td>
                    <td style={{ textAlign: "center" }}>
                      {total > 0 ? total : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{ marginTop: "20px", textAlign: "left" }}>
            <b>*Итого</b> – общее количество баллов за текущий семестр по
            дисциплине.
          </div>

          <table className="students-table2" style={{ marginTop: "10px" }}>
            <thead>
              <tr>
                <th>Баллы</th>
                <th>Зачет</th>
                <th>Зачет с оценкой</th>
                <th>Экзамен</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>0-59</td>
                <td>Не зачтено</td>
                <td>Неудовлетворительно</td>
                <td>Неудовлетворительно</td>
              </tr>
              <tr>
                <td>60-70</td>
                <td>Зачтено</td>
                <td>Удовлетворительно</td>
                <td>Удовлетворительно</td>
              </tr>
              <tr>
                <td>71-90</td>
                <td>Зачтено</td>
                <td>Хорошо</td>
                <td>Хорошо</td>
              </tr>
              <tr>
                <td>91-100</td>
                <td>Зачтено</td>
                <td>Отлично</td>
                <td>Отлично</td>
              </tr>
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
