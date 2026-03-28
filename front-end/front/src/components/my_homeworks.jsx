import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { fetchTaskById } from "./api";

export function MyHomeworks() {
    const { taskId } = useParams(); // task id
    const queryClient = useQueryClient();
    const { data: task, isLoading } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => fetchTaskById(taskId),
    refetchInterval: 1000,

    initialData: () => {
      const allTasks = queryClient.getQueryData(["tasks"]);
      return allTasks?.tasks?.find(t => t.id === Number(taskId));
    },
  });

  if (isLoading) return <div>Загрузка задания...</div>;
  if (!task) return <div>Задание не найдено</div>;

  return (
    <div className="progresst">
      <h1>{task.title}</h1>
      <p>{task.description}</p>
      <p>Дедлайн: {task.deadline}</p>
      <p>Макс балл: {task.max_score}</p>
    </div>
  );
}