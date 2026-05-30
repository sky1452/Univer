import { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff } from "lucide-react";
import { fetchHomeworkById, fetchHomeworkSubmissions } from "./api";
import { StudentSubmissionCard } from "./StudentSubmissionCard";

export function CheckHomework({ disciplineId, group, userId, homeworkId }) {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const queryClient = useQueryClient();  
  const [showAll, setShowAll] = useState(false);
  const [showSubmitted, setShowSubmitted] = useState(true);
  const [showNotSubmitted, setShowNotSubmitted] = useState(false);

  const studentWorkRef = useRef(null);

  const {
    data: homework,
    isLoading: homeworkLoading,
  } = useQuery({
    refetchInterval: 1000,
    queryKey: ["homework", userId, group, disciplineId, homeworkId],
    queryFn: () => fetchHomeworkById(userId, group, disciplineId, homeworkId),
    enabled: !!userId && !!group && !!disciplineId && !!homeworkId,
  });

  const {
    data: studentsWithSubmissions = [],
    isLoading: submissionsLoading,
  } = useQuery({
    refetchInterval: 1000,
    queryKey: ["homework-submissions", homeworkId, group],
    queryFn: () => fetchHomeworkSubmissions(homeworkId, group),
    enabled: !!homeworkId && !!group,
  });

  const submittedStudents = studentsWithSubmissions.filter(
    (student) => student.submitted
  );

  const notSubmittedStudents = studentsWithSubmissions.filter(
    (student) => !student.submitted
  );

  const selectedStudentData = studentsWithSubmissions.find(
    (student) => String(student.student_id) === String(selectedStudent)
  );

  const latestSubmission = useMemo(() => {
    if (!selectedStudentData?.submissions?.length) return null;
    return selectedStudentData.submissions[0];
  }, [selectedStudentData]);

  const allFiles = selectedStudentData?.files || [];

  const handleStudentClick = (studentId, submitted) => {
    if (!submitted) return;

    if (String(selectedStudent) === String(studentId)) {
      setSelectedStudent(null);
      return;
    }

    setSelectedStudent(studentId);

    setTimeout(() => {
      studentWorkRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  };

  const handleCloseCard = () => {
    setSelectedStudent(null);
  };

  if (!homeworkId) return null;

  if (homeworkLoading || submissionsLoading) {
    return <p>Загрузка задания и ответов студентов...</p>;
  }

  return (
    <div className="check-homework-container">
      <div className="zadaniye2">
        <h2>{homework.title}</h2>
        <p>Описание: {homework.description}</p>
        <p>Максимальный балл: {homework.max_score}</p>
        <p>Дедлайн: {new Date(homework.deadline).toLocaleString("ru-RU")}</p>
      </div>

      <div className="check-homework-section">
        <h3 className="check-homework-title-row">
          Студенты группы
          <span
            className="check-homework-eye"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? <Eye size={18} /> : <EyeOff size={18} />}
          </span>
        </h3>

        {showAll && (
          <div className="check-homework-inline-list check-homework-list-block">
            {studentsWithSubmissions.map((student, index) => (
              <span key={student.student_id}>
                <span
                  onClick={() =>
                    handleStudentClick(student.student_id, student.submitted)
                  }
                  className={
                    student.submitted
                      ? "check-homework-student-link"
                      : "check-homework-student-text"
                  }
                >
                  {student.student_name}
                </span>
                {index !== studentsWithSubmissions.length - 1 && ","}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="check-homework-section">
        <h3 className="check-homework-title-row">
          Не прислали работу
          <span
            className="check-homework-eye"
            onClick={() => setShowNotSubmitted(!showNotSubmitted)}
          >
            {showNotSubmitted ? <Eye size={18} /> : <EyeOff size={18} />}
          </span>
        </h3>

        {showNotSubmitted && (
          <div className="check-homework-inline-list check-homework-list-block">
            {notSubmittedStudents.length > 0 ? (
              notSubmittedStudents.map((student, index) => (
                <span key={student.student_id}>
                  {student.student_name}
                  {index !== notSubmittedStudents.length - 1 && ","}
                </span>
              ))
            ) : (
              <span>Все студенты прислали работу.</span>
            )}
          </div>
        )}
      </div>

      <div className="check-homework-section">
        <h3 className="check-homework-title-row">
          Прислали работу
          <span
            className="check-homework-eye"
            onClick={() => setShowSubmitted(!showSubmitted)}
          >
            {showSubmitted ? <Eye size={18} /> : <EyeOff size={18} />}
          </span>
        </h3>

        {showSubmitted && (
          <div className="check-homework-inline-list check-homework-list-block">
            {submittedStudents.length > 0 ? (
              submittedStudents.map((student, index) => (
                <span key={student.student_id}>
                  <span
                    onClick={() =>
                      handleStudentClick(student.student_id, true)
                    }
                    className="check-homework-student-link"
                  >
                    {student.student_name}
                  </span>
                  {index !== submittedStudents.length - 1 && ","}
                </span>
              ))
            ) : (
              <span>Пока никто не прислал работу.</span>
            )}
          </div>
        )}
      </div>

      <StudentSubmissionCard
        studentWorkRef={studentWorkRef}
        selectedStudentData={selectedStudentData}
        latestSubmission={latestSubmission}
        allFiles={allFiles}
        homeworkId={homeworkId}
        onClose={handleCloseCard}
        onScoreSaved={() => {
    queryClient.invalidateQueries({
      queryKey: ["homework-submissions", homeworkId, group],
    });
  }}
/>
    </div>
  );
}