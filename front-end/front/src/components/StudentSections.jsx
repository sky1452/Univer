import { Link, useLocation } from 'react-router-dom';
import { Home, ClipboardCheck, Award, CalendarDays, Megaphone, Trophy} from "lucide-react";


const sections = [
  {
    name: 'Домашняя страница',
    id: 1,
    link: '/profile_student',
    icon: <Home size={18} />,
  },
  {
    name: 'Успеваемость',
    id: 2,
    link: '/progress_student',
    icon: <Award size={18} />,
  },
  {
    name: 'Расписание',
    id: 3,
    link: '/schedule_student',
    icon: <CalendarDays size={18} />,
  },
  {
    name: 'Предстоящие события',
    id: 4,
    link: '/events_student',
    icon: <Megaphone size={18} />,
  },
  {
    name: 'Мои задания',
    id: 5,
    link: '/homework_student',
    icon: <ClipboardCheck size={18} />,
  },
  {
    name: 'Рейтинг',
    id: 6,
    link: '/rating_student',
    icon: <Trophy size={18} />,
  },
];
export function SectionsStudent() {
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