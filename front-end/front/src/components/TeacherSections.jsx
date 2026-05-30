import { Link, useLocation } from 'react-router-dom';
import { Home,CalendarDays, Megaphone,  ClipboardList,  NotebookPen, ChartColumn } from "lucide-react";
const sections = [
  {
    name: 'Домашняя страница',
    id: 1,
    link: '/profile_teacher',
    icon: <Home size={18} />,
  },
  {
    name: 'Группы и дисциплины',
    id: 2,
    link: '/groups_teacher',
    icon: <NotebookPen size={18} />,
  },
  {
    name: 'Текущее расписание',
    id: 3,
    link: '/schedule_teacher',
    icon: <CalendarDays size={18} />,
  },
  {
    name: 'Предстоящие события',
    id: 4,
    link: '/events_teacher',
    icon: <Megaphone size={18} />,
  },
  {
    name: 'Формирование успеваемости',
    id: 5,
    link: '/progress_teacher',
    icon: <ChartColumn size={18} />,
  },
  {
    name: 'Управление работами',
    id: 6,
    link: '/homework_teacher',
    icon: <ClipboardList size={18} />,
  },
];

export function SectionsTeacher() {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (sectionLink) => {
    return currentPath === sectionLink || currentPath.startsWith(sectionLink + '/');
  };

  return (
    <div className="sections-container">
      {sections.map((section) => (
        <Link
          key={section.id}
          className="sections"
          to={section.link}
          style={{
            border: isActive(section.link) ? "1px solid #ccc" : "none",
          }}
        >
          <p>{section.icon} {section.name}</p>
        </Link>
      ))}
    </div>
  );
}
