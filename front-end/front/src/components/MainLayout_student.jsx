import { Outlet } from 'react-router-dom';
import { SectionsStudent } from './StudentSections';

export function MainLayoutStudent() {
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <SectionsStudent />
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}