import { API_URL } from "../config";
import { FileText } from "lucide-react";

export function HomeworkInfo({
  task,
  taskId,
  userId,
  submissionData,
  submissionLoading,
  scoreData,
  scoreLoading,
  createAnswer,
  onCreateAnswer,
}) {
  const hasScore = scoreData?.score !== null && scoreData?.score !== undefined;

  return (
    <div className="my-homework1">
      <div className="div01">{task.title}</div>

      <div className="div02">Описание задания:</div>
      <div className="div03">{task.description}</div>

      <div className="div04">Максимальная оценка:</div>
      <div className="div05">{task.max_score}</div>

      <div className="div06">Задание создано:</div>
      <div className="div07">
        <img
          className="avatar_teacher"
          src={`data:image/png;base64,${task.teacher?.avatar}`}
          alt="Аватар преподавателя"
        />{" "}
        {task.teacher?.name}, {task.created_at}
      </div>

      <div className="div08">Крайний срок сдачи:</div>
      <div className="div09">{task.deadline}</div>

      <div className="div010">Ответ в виде файла:</div>
      <div className="div011">
        {submissionLoading ? (
          "Загрузка..."
        ) : submissionData?.files?.length > 0 ? (
          <div
            style={{
              color: "black",
              display: "flex",
              flexWrap: "wrap",
              gap: "6px",
              alignItems: "center",
            }}
          >
            {submissionData.files.map((file, index) => (
              <span
                key={index}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <a
                  className="file-link"
                  href={`${API_URL}/tasks/${taskId}/student/${userId}/files/${index}/download`}
                >
                  <FileText size={18} />
                  {file.file_name}
                </a>
                {index !== submissionData.files.length - 1 && ","}
              </span>
            ))}
          </div>
        ) : (
          "-"
        )}
      </div>

      <div className="div012">Ваш комментарий:</div>
      <div className="div013">
        {submissionLoading ? "Загрузка..." : submissionData?.comment || "-"}
      </div>

      <div className="div014">Последнее изменение:</div>
      <div className="div015">{task.updated_at}</div>

      <div className="div016">Состояние оценивания:</div>
      <div className="div017">
        {scoreLoading
          ? "Загрузка..."
          : scoreData?.score !== null && scoreData?.score !== undefined
            ? `${scoreData.score} / ${task.max_score}`
            : "-"}
      </div>

      {!hasScore && !createAnswer && (
        <div className="div018" onClick={onCreateAnswer}>
          Создать ответ
        </div>
      )}
    </div>
  );
}
