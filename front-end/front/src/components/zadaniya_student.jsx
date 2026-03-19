import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function Homework_studentPage(){
const navigate = useNavigate();

  const [discipline, setDiscipline] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.userId;
  

 useEffect(() => {
  setLoading(true);

  if (!userId) {
    setLoading(false);
    return;
  }

  fetch(`http://localhost:8081/mySchedule/${userId}`)
    .then(res => res.json())
    .then((data) => {

      const IdSlugName = new Map();

      data.forEach(item => {
        if (!IdSlugName.has(item.disciplineId)) {
          IdSlugName.set(item.disciplineId, {
            id: item.disciplineId,
            slug: item.disciplineSlug,
            name:
              item.labName ||
              item.practicName ||
              item.lectureName
          });
        }
      });

      const ISN = Array.from(IdSlugName.values())
        .sort((a, b) => a.name.localeCompare(b.name, "ru"));

      setDiscipline(ISN);
      setLoading(false);
    })
    .catch((error) => {
      console.error("Ошибка при загрузке дисциплин:", error);
      setLoading(false);
    });

}, [userId]);
if (loading) return <p>Загрузка дисципилин...</p>
  return (
    <div className="progresst">Проверка заданий
    
    <div>
 <div style={{ textAlign: 'left', fontSize: '20px', marginTop: '4%' }}>Ваши недавно посещённые курсы:</div>
      <table className="data-table1">
  <thead>
    <tr>
      
    </tr>
  </thead>
  <tbody>
    <tr>
      
  <td><div className="square">1</div></td>
  <td><div className="square">1</div></td>
  <td><div className="square">1</div></td>
  <td><div className="square">1</div></td>
</tr>
    
    <tr>
      <td>Алгоритмы и структуры данных</td>
      <td>Инженерная и компьютерная графика</td>
      <td>Интеллектуальные системы и технологии</td>
      <td>Операционные системы</td>
    </tr>
  </tbody>
</table>
    </div>
    {discipline.length === 0 ? (
      <p>Нет дисциплин для отображения</p>
    ) : (
      <div style={{ textAlign: 'left', fontSize: '20px', marginTop: '4%' }} className="courses">
        Выберите курс:
        {discipline.map((coures) => (
        
          <p key={coures.id}
           className="course-item"
           
           onClick={() => 
            navigate(`/homework_student/${coures.id}/${coures.slug}`)
           }
           >{coures.name}</p>
        ))}
      </div>
    )}
    </div>
  );
    
}