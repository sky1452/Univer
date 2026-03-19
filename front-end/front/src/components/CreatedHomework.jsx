import { useState, useEffect} from "react";
import { Trash2, Pencil } from "lucide-react";

export function CreatedHomework({disciplineId, group, userId}) {
    const [loading, setLoading] = useState(true);
    const [homeworks, setHomeworks] = useState([]);

useEffect(() => {
  fetch(`http://localhost:8081/getHomeworks?disciplineId=${disciplineId}&group=${group}&teacherId=${userId}`) //ф-ия получения массива созданных заданий по дисциплине, группе и преподу 
    .then((response) => response.json())
    .then((data) => {
        {/* [
  {
    "id": 1,
    "title": "ПРИб-235 конспекты лекций",
    "description": "Необходимо подготовить конспекты лекций по дисциплине \"Электроника и Схемотехника\"",
    "max_score": 100,
    "created_at": "2023-10-01 17:40",
    "updated_at": "2023-10-01 20:30",
    "deadline": "2023-10-15 08:30"
  }
]*/}
            if (data.error) {
        console.error("Server error:", data.error);
        setHomeworks([]); // пустой массив
        setLoading(false);
        return;
      }
      data.forEach(hw => {
            if (hw.created_at === hw.updated_at) {
             hw.updated_at = "—";
     } 
    });
      // Если сервер вернул массив
      if (!Array.isArray(data)) {
        console.warn("Unexpected data format:", data);
        setHomeworks([]);
        setLoading(false);
        return;
      }
      setHomeworks(data);
        setLoading(false);
        if (data.length === 0) {
          setHomeworks([]);
        }
    })
    .catch((err) => console.error(err));
}, [disciplineId, group, userId]);

if (homeworks.length === 0) return <p>У вас пока нет созданных заданий в этой дисциплине и группе.</p>;
if (loading) return <p>Загрузка ваших созданных заданий...</p>;

return(
    
<div >

<table className="createdhomework">
  
  <thead>
    <tr>
      <th>Название</th>
      <th>Описание</th>
      <th>Баллы</th>
      <th>Создано</th>
      <th>Обновлено</th>
      <th>Дедлайн</th>
      <th>Действия</th>
    </tr>
  </thead>
  <tbody>
    {homeworks.map((hw) => (
         <tr key={hw.id}>
              <td>{hw.title}</td>
              <td>{hw.description}</td>
              <td>{hw.max_score}</td>
              <td>{hw.created_at}</td>
              <td>{hw.updated_at}</td>
              <td>{hw.deadline}</td>
              <td>
                <Pencil size={18} /> <Trash2 size={18} />
              </td>
            </tr>
    ))}

  </tbody>
</table>

</div>

);

}