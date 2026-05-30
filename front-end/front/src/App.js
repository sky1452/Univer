import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { HomeworkPage } from "./components/zadaniya_teacher";
import { MainLayoutTeacher } from "./components/MainLayout_teacher";
import { Datap } from "./components/TeacherProfile";
import { SchedulePage } from "./components/TeacherSchedule";
import Login from "./components/Login";
import { ProgressPage } from "./components/TeacherProgress";
import { HomeworkPageId } from "./components/zadaniya_perexod";
import { HomeworkStudentPage } from "./components/zadaniya_student";
import { HomeworkStudentPageId } from "./components/zadaniya_perexod_student";
import { MainLayoutStudent } from "./components/MainLayout_student";
import { DatapStudent } from "./components/StudentProfile";
import { SchedulePageStudent } from "./components/StudentSchedule";
import { ProgressPageStudent } from "./components/StudentProgress";
import { MyHomeworks } from "./components/MyHomework";

import "./styles/zadaniya_perexod_student.css";
import "./styles/zadaniya_perexod.css";
import "./styles/layout.css";
import "./styles/profil_teacher.css";
import "./styles/stylet.css";
import "./styles/Login.css";
import "./styles/schedule_teacher.css";
import "./styles/progress_teacher.css";
import "./styles/progress_student.css";
import "./styles/zadaniya_teacher.css";
import "./styles/createhomework.css";
import "./styles/createdhomework.css";
import "./styles/my_homework.css";
import "./styles/get_homework.css";
import "./styles/checkHomework.css";

function GroupsPage() {
  return <h2>Учебные группы и дисциплины</h2>;
}
function EventsPage() {
  return <h2>Предстоящие события</h2>;
}

function RatingStudentPage() {
  return <div className="progresst"></div>;
}
function EventsStudentPage() {
  return <h2>Предстоящие события</h2>;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<Login />} />

        <Route element={<MainLayoutTeacher />}>
          <Route path="/profile_teacher" element={<Datap />} />
          <Route path="/groups_teacher" element={<GroupsPage />} />
          <Route path="/schedule_teacher" element={<SchedulePage />} />
          <Route path="/events_teacher" element={<EventsPage />} />
          <Route path="/progress_teacher" element={<ProgressPage />} />
          <Route path="/homework_teacher" element={<HomeworkPage />} />
          <Route
            path="/homework_teacher/:disciplineId/:disciplineSlug"
            element={<HomeworkPageId />}
          />
          <Route
            path="/homework_teacher/:disciplineId/:disciplineSlug/:group/:homeworkId"
            element={<HomeworkPageId />}
          />
        </Route>
        <Route element={<MainLayoutStudent />}>
          <Route path="/profile_student" element={<DatapStudent />} />
          <Route path="/rating_student" element={<RatingStudentPage />} />
          <Route path="/schedule_student" element={<SchedulePageStudent />} />
          <Route path="/events_student" element={<EventsStudentPage />} />
          <Route path="/progress_student" element={<ProgressPageStudent />} />
          <Route path="/homework_student" element={<HomeworkStudentPage />} />
          <Route
            path="/homework_student/:disciplineId/:disciplineSlug"
            element={<HomeworkStudentPageId />}
          />
          <Route
            path="/homework_student/:disciplineId/:disciplineSlug/:taskId"
            element={<MyHomeworks />}
          />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
