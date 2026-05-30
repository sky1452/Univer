import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import {
  fetchTaskById,
  fetchDiscipline,
  submitHomework,
  fetchFileById,
  fetchSubmissionScore,
  updateHomeworkAnswer,
} from "./api";
import { HomeworkInfo } from "./HomeworkInfo";
import { HomeworkAnswerForm } from "./HomeworkAnswerForm";

export function MyHomeworks() {
  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.userId;

  const bottomRef = useRef(null);

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [existingFiles, setExistingFiles] = useState([]);
  const [comment, setComment] = useState("");
  const [formMode, setFormMode] = useState(null); // null | create | edit
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { disciplineId, taskId } = useParams();
  const queryClient = useQueryClient();

  const { data: submissionData, isLoading: submissionLoading } = useQuery({
    queryKey: ["submission-files", taskId, userId],
    queryFn: () => fetchFileById(taskId, userId),
    enabled: !!taskId && !!userId,
    refetchInterval: 1000,
  });

  const { data: scoreData, isLoading: scoreLoading } = useQuery({
    queryKey: ["submission-score", taskId, userId],
    queryFn: () => fetchSubmissionScore(taskId, userId),
    enabled: !!taskId && !!userId,
    refetchInterval: 1000,
  });

  const { data: task, isLoading: taskLoading } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => fetchTaskById(taskId),
    refetchInterval: 1000,
    initialData: () => {
      const allTasks = queryClient.getQueryData(["tasks"]);
      return allTasks?.tasks?.find((t) => t.id === Number(taskId));
    },
  });

  const { data: discipline, isLoading: disciplineLoading } = useQuery({
    queryKey: ["discipline", disciplineId],
    queryFn: () => fetchDiscipline(disciplineId),
    refetchInterval: 1000,
    initialData: () => {
      const allDisciplines = queryClient.getQueryData(["disciplines"]);
      return allDisciplines?.disciplines?.find(
        (d) => d.id === Number(disciplineId)
      );
    },
  });

  useEffect(() => {
    if (formMode) {
      bottomRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [formMode]);

  const openCreateForm = () => {
    setFormMode("create");
    setUploadedFiles([]);
    setExistingFiles([]);
    setComment("");
  };

  const openEditForm = () => {
    setFormMode("edit");
    setUploadedFiles([]);
    setExistingFiles(submissionData?.files || []);
    setComment(submissionData?.comment || "");
  };

  const handleCloseForm = () => {
    setFormMode(null);
    setUploadedFiles([]);
    setExistingFiles([]);
    setComment("");
  };

  const handleRemoveExistingFile = (fileIndex) => {
    setExistingFiles((prev) =>
      prev.filter((file) => file.file_index !== fileIndex) // Удаляем файл по уникальному индексу
    );
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      if (formMode === "create") {
        await submitHomework(
          taskId,
          comment,
          uploadedFiles,
          userId,
          disciplineId
        );
      }

      if (formMode === "edit") {
        await updateHomeworkAnswer({
          taskId,
          userId,
          disciplineId,
          comment,
          newFiles: uploadedFiles,
          keptFileIndexes: existingFiles.map((file) => file.file_index),
        });
      }

      alert(formMode === "edit" ? "Изменения сохранены!" : "Отправлено!");

      setFormMode(null);
      setComment("");
      setUploadedFiles([]);
      setExistingFiles([]);

      queryClient.invalidateQueries({
        queryKey: ["submission-files", taskId, userId],
      });
      queryClient.invalidateQueries({
        queryKey: ["submission-score", taskId, userId],
      });
    } catch (e) {
      alert(formMode === "edit" ? "Ошибка сохранения" : "Ошибка отправки");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (disciplineLoading) return <div>Загрузка дисциплины...</div>;
  if (taskLoading) return <div>Загрузка задания...</div>;
  if (!task) return <div>Задание не найдено</div>;

  return (
    <div className={`progresst ${isSubmitting ? "blurred-content" : ""}`}>
      <div>{discipline?.name}</div>

      <HomeworkInfo
        task={task}
        taskId={taskId}
        userId={userId}
        submissionData={submissionData}
        submissionLoading={submissionLoading}
        scoreData={scoreData}
        scoreLoading={scoreLoading}
        createAnswer={!!formMode}
        onCreateAnswer={openCreateForm}
        onEditAnswer={openEditForm}
      />

      {formMode && (
        <HomeworkAnswerForm
          bottomRef={bottomRef}
          isSubmitting={isSubmitting}
          mode={formMode}
          initialComment={comment}
          existingFiles={existingFiles}
          onRemoveExistingFile={handleRemoveExistingFile}
          onClose={handleCloseForm}
          onFilesChange={setUploadedFiles}
          onCommentChange={setComment}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}