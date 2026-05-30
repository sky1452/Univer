import { Outlet } from 'react-router-dom';
import { SectionsTeacher } from './TeacherSections';

export function MainLayoutTeacher() {
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <SectionsTeacher />
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}