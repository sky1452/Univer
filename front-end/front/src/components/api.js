export const fetchDiscipline = async (disciplineId) => {
  const res = await fetch(`http://localhost:8081/discipline/${disciplineId}`);
  return res.json();
};

export const fetchStudentTasks = async (disciplineId, userId) => {
  const res = await fetch(
    `http://localhost:8081/discipline/${disciplineId}/student/${userId}`
  );
  return res.json();
};

export const fetchTaskById = async (taskId) => {
  const res = await fetch(`http://localhost:8081/tasks/${taskId}`);
  return res.json();
};