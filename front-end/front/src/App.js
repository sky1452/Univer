import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { HomeworkPage} from './components/zadaniya_teacher';
import { MainLayout_teacher } from './components/MainLayout_teacher';
import { Datap } from './components/profil_teacher';
import { SchedulePage } from './components/schedule_teacher';
import  Login  from './components/vhod';
import{ ProgressPage } from './components/progress_teacher'
import {HomeworkPage_id} from './components/zadaniya_perexod';
import {Homework_studentPage} from './components/zadaniya_student';
import {HomeworkStudentPage_id} from './components/zadaniya_perexod_student';
import { MainLayout_student } from './components/MainLayout_student';
import { Datap_student } from './components/profil_student';
import { SchedulePage_student } from './components/schedule_student';
import{ ProgressPage_student } from './components/progress_student';

import './styles/zadaniya_perexod.css';
import './styles/layout.css';
import './styles/profil_teacher.css';
import './styles/stylet.css';
import './styles/Login.css';
import './styles/schedule_teacher.css';
import './styles/progress_teacher.css';
import './styles/progress_student.css';
import './styles/zadaniya_teacher.css';
import './styles/createhomework.css';
import './styles/createdhomework.css';

function GroupsPage() {
  return <h2>Учебные группы и дисциплины</h2>;
}
function EventsPage() {
  return <h2>Предстоящие события</h2>;
}

function Rating_studentPage() {
  return <h2>Рейтинг студента</h2>;
}
function Events_studentPage() {
  return <h2>Предстоящие события</h2>;
}

function App() {
  return (
    <Router>
      <Routes>
        
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<Login />} />

        
        <Route element={<MainLayout_teacher />}>
          <Route path="/profile_teacher" element={<Datap />} />
          <Route path="/groups_teacher" element={<GroupsPage />} />{/*костыль*/}
          <Route path="/schedule_teacher" element={<SchedulePage />} />
          <Route path="/events_teacher" element={<EventsPage />} />{/*костыль*/}
          <Route path="/progress_teacher" element={<ProgressPage />} />
          <Route path="/homework_teacher" element={<HomeworkPage />} />
          <Route 
          path="/homework_teacher/:disciplineId/:disciplineSlug" 
          element={<HomeworkPage_id />} 
        />
          </Route>
          <Route element={<MainLayout_student />}>
          <Route path="/profile_student" element={<Datap_student />} />
          <Route path="/rating_student" element={<Rating_studentPage />} />{/*костыль*/}
          <Route path="/schedule_student" element={<SchedulePage_student />} />
          <Route path="/events_student" element={<Events_studentPage />} />{/*костыль*/}
          <Route path="/progress_student" element={<ProgressPage_student />} />
          <Route path="/homework_student" element={<Homework_studentPage />} />
           <Route 
          path="/homework_student/:disciplineId/:disciplineSlug" 
          element={<HomeworkStudentPage_id />} 
        /> {/*костыль*/}
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
