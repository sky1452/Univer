import { useEffect, useRef, useState } from "react";
import { FileText, X, Check } from "lucide-react";
import { updateSubmissionScore } from "./api";

export function StudentSubmissionCard({
  studentWorkRef,
  selectedStudentData,
  latestSubmission,
  allFiles,
  homeworkId,
  maxScore,
  onClose,
  onScoreSaved,
}) {
  const [scoreValue, setScoreValue] = useState("");
  const [initialScore, setInitialScore] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [scoreError, setScoreError] = useState("");
  const [saveStatus, setSaveStatus] = useState("idle"); //idle | success | error

  const prevSubmissionIdRef = useRef(null);

  useEffect(() => {
    if (!latestSubmission) {
      setScoreValue("");
      setInitialScore("");
      setSaveStatus("idle");
      setScoreError("");
      prevSubmissionIdRef.current = null;
      return;
    }

    const score =
      latestSubmission.score !== null && latestSubmission.score !== undefined
        ? String(latestSubmission.score)
        : "";

    setScoreValue(score);
    setInitialScore(score);
    setScoreError("");

    const currentSubmissionId = latestSubmission.submission_id;
    const prevSubmissionId = prevSubmissionIdRef.current;

    if (prevSubmissionId !== currentSubmissionId) {
      setSaveStatus("idle");
    }

    prevSubmissionIdRef.current = currentSubmissionId;
  }, [latestSubmission]);

  if (!selectedStudentData || !latestSubmission) return null;

  const scoreChanged = scoreValue !== initialScore;

  const handleSaveScore = async () => {
    setScoreError("");
    setSaveStatus("idle");

    if (scoreValue === "") {
      setScoreError("Введите оценку");
      setSaveStatus("error");
      return;
    }

    const numericScore = Number(scoreValue);

    if (Number.isNaN(numericScore)) {
      setScoreError("Оценка должна быть числом");
      setSaveStatus("error");
      return;
    }

    if (numericScore < 0) {
      setScoreError("Оценка не может быть меньше 0");
      setSaveStatus("error");
      return;
    }

    if (numericScore > maxScore) {
      setScoreError(`Оценка не может быть больше ${maxScore}`);
      setSaveStatus("error");
      return;
    }

    try {
      setIsSaving(true);

      await updateSubmissionScore(latestSubmission.submission_id, numericScore);

      setInitialScore(String(numericScore));
      setScoreValue(String(numericScore));
      setSaveStatus("success");

      if (onScoreSaved) onScoreSaved();
    } catch (error) {
      setSaveStatus("error");
      setScoreError(error.message || "Ошибка сохранения оценки");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div ref={studentWorkRef} className="check-homework-student-card">
      <div className="check-homework-student-card-header">
        <h3>Работа студента: {selectedStudentData.student_name}</h3>

        <button
          type="button"
          className="check-homework-close-button"
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </div>

      <div className="check-homework-info-row">
        <strong>Комментарий:</strong>
        <span>{latestSubmission.comment || "-"}</span>
      </div>

      <div className="check-homework-info-row">
        <strong>Оценка:</strong>

        <div className="check-homework-score-box">
          <input
            type="number"
            min="0"
            max={maxScore}
            value={scoreValue}
            onChange={(e) => {
              setScoreValue(e.target.value);
              setSaveStatus("idle");
            }}
            className="check-homework-score-input"
          />

          <span className="check-homework-score-max">/ {maxScore}</span>

          {scoreChanged && saveStatus === "idle" && (
            <button
              type="button"
              onClick={handleSaveScore}
              disabled={isSaving}
              className="check-homework-score-save"
            >
              {isSaving ? "..." : "Сохранить"}
            </button>
          )}

          {!scoreChanged && saveStatus === "success" && (
            <Check size={18} color="green" />
          )}

          {!scoreChanged && saveStatus === "error" && (
            <X size={18} color="red" />
          )}
        </div>
      </div>

      {scoreError && (
        <div className="check-homework-score-error">{scoreError}</div>
      )}

      <div className="check-homework-info-row">
        <strong>Дата отправки:</strong>
        <span>
          {new Date(latestSubmission.created_at).toLocaleString("ru-RU")}
        </span>
      </div>

      <div className="check-homework-info-row">
        <strong>Файлы:</strong>

        <div className="check-homework-files-wrap">
          {allFiles.length > 0
            ? allFiles.map((file, index) => (
                <span
                  key={`${selectedStudentData.student_id}-${file.file_index}`}
                >
                  <a
                    href={`${API_URL}/tasks/${homeworkId}/student/${selectedStudentData.student_id}/files/${file.file_index}/download`}
                    className="file-link check-homework-file-link"
                  >
                    <FileText size={18} />
                    {file.file_name}
                  </a>
                  {index !== allFiles.length - 1 && ", "}
                </span>
              ))
            : "-"}
        </div>
      </div>
    </div>
  );
}
