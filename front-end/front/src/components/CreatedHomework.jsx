import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, Pencil } from "lucide-react";
import { getHomeworks, deleteHomework } from "./api";
import { EditHomework } from "./EditHomework";

export function CreatedHomework({ disciplineId, group, userId }) {
  const queryClient = useQueryClient();
  const [editingHomework, setEditingHomework] = useState(null);
  const tableRef = useRef(null);

  const {
    data: homeworks = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["homeworks", disciplineId, group, userId],
    queryFn: () =>
      getHomeworks({
        disciplineId,
        group,
        teacherId: userId,
      }),
    enabled: Boolean(disciplineId && group && userId),
  });

  const deleteHomeworkMutation = useMutation({
    mutationFn: ({ homeworkId, teacherId }) =>
      deleteHomework({ homeworkId, teacherId }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["homeworks", disciplineId, group, userId],
      });
    },
  });

  const handleDeleteHomework = (homeworkId) => {
    const confirmed = window.confirm("Удалить это задание?");
    if (!confirmed) return;

    deleteHomeworkMutation.mutate({
      homeworkId,
      teacherId: userId,
    });
  };

  if (isLoading) {
    return <p>Загрузка ваших созданных заданий...</p>;
  }

  if (isError) {
    return <p>Ошибка при загрузке заданий: {error.message}</p>;
  }

  return (
    <div>
      {homeworks.length === 0 ? (
        <p>У вас пока нет созданных заданий в этой дисциплине и группе.</p>
      ) : (
        <table ref={tableRef} className="createdhomework">
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
  {[...homeworks]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) // новые сверху
    .map((hw) => (
      <tr key={hw.id}>
        <td>{hw.title}</td>
        <td>{hw.description}</td>
        <td>{hw.max_score}</td>
        <td>{hw.created_at}</td>
        <td>{hw.updated_at}</td>
        <td>{hw.deadline}</td>
        <td>
          <div className="actions">
            <Pencil
              size={18}
              onClick={() => setEditingHomework(hw)}
              className="edit"
            />
            <Trash2
              size={18}
              onClick={() => handleDeleteHomework(hw.id)}
              className="delete"
            />
          </div>
        </td>
      </tr>
    ))}
</tbody>
        </table>
      )}

      {deleteHomeworkMutation.isPending && <p>Удаление задания...</p>}
      {deleteHomeworkMutation.isError && (
        <p>Ошибка удаления: {deleteHomeworkMutation.error.message}</p>
      )}

      {editingHomework && (
        <EditHomework
          homework={editingHomework}
          teacherId={userId}
          disciplineId={disciplineId}
          group={group}
          tableRef={tableRef}
          onClose={() => setEditingHomework(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({
              queryKey: ["homeworks", disciplineId, group, userId],
            });
            setEditingHomework(null);
          }}
        />
      )}
    </div>
  );
}