import { useState} from "react";
export function CreateHomework({ disciplineId, group, userId }) {
const [nameHomework, setNameHomework] = useState("");
const [description, setDescription] = useState("");
const [deadline, setDeadline] = useState("");
const [maxScore, setMaxScore] = useState("");

function handleCreateHomework() { ///ф-ия создания задания, отправляет данные на бэк
  try {
    if (!nameHomework.trim() || !deadline || !description.trim() || !maxScore.trim()) {
  throw new Error("Заполните все поля задания");
}
    const data = {
      teacher_id: userId,
      groupName: group,
      disciplineId: parseInt(disciplineId),
      title: nameHomework,
      description: description,
      deadline: deadline + ":00+03:00",
      max_score: parseInt(maxScore, 10),
    };
    console.log("Отправляемые данные:", data);
    fetch("http://localhost:8081/createHomework", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(data)
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Ошибка при создании задания");
        }
        return response.json();
      })
      .then(() => {
        alert("Задание сохранено");
      })
      .catch((error) => {
        alert(error.message);
      });
  } catch (error) {
    alert(error.message);
  }
}


return (
  <div className="create-homework">
    <div className="div1">Название задания:</div>

    <div className="div2">
  <div
    contentEditable={true}
    className="editable"
    onInput={(e) => setNameHomework(e.target.textContent)}
  ></div>
</div>
    <div className="div3">Описание:</div>

    <div className="div4">
    <div
    contentEditable={true}
      className="editable"
      onInput={(e) => setDescription(e.currentTarget.textContent)}
    ></div>
</div>
    <div className="div5">Дедлайн:</div>

    <input
      className="div6"
      type="datetime-local"
      onChange={(e) => setDeadline(e.target.value)}
    />
    
<div className="div7">Максимальный балл:</div>

    <div className="div8">
  <div
    
    contentEditable={true}
    className="editable"
    onBeforeInput={(e) => {
      const text = e.currentTarget.textContent || "";
      if (!/^\d$/.test(e.data)) {
        e.preventDefault();
        return;
      }
      if (text.length >= 3) {
        e.preventDefault();
      }
    }}
    onInput={(e) => {
      setMaxScore(e.currentTarget.textContent);
    }}
  ></div>
</div>

    <div
      className="div11"
      onClick={handleCreateHomework}
    >
      Создать задание
    </div>
    
  </div>
);
}