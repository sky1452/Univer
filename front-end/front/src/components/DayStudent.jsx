export function Day({ title, data }) {
  // Сначала создаём объект для группировки
  const groupedData = {};

  data.forEach((para) => {
    // Формируем ключ по времени, предмету и преподавателям
    const key = `${para.paraNum}-${para.lectureName || para.labName || para.practicName}-${para.teacherNames?.join(",")}`;

    if (!groupedData[key]) {
      groupedData[key] = { ...para, groupNames: [para.groupName] };
    } else {
      groupedData[key].groupNames.push(para.groupName);
    }
  });

  // Преобразуем объект обратно в массив
  const displayData = Object.values(groupedData);

  // Сортируем по номеру пары
  displayData.sort((a, b) => a.paraNum - b.paraNum);

  return (
    <div className="grid-element">
      <table className="table-schedule">
        <thead>
          <tr className="header">
            <th colSpan="3">{title}</th>
          </tr>
        </thead>
        <tbody>
          {displayData.length === 0 ? (
            <tr>
              <td colSpan="3" className="td-schedule" style={{ textAlign: 'center' }}>Нет занятий</td>
            </tr>
          ) : (
            displayData.map((para, idx) => (
              <tr key={para.id} className={idx % 2 === 0 ? "row-light" : "row-dark"}>
                <td className="td-schedule">
                  {para.paraNum === 1 && "8:30"}
                  {para.paraNum === 2 && "10:10"}
                  {para.paraNum === 3 && "12:00"}
                  {para.paraNum === 4 && "13:40"}
                  {para.paraNum === 5 && "15:20"}
                  {para.paraNum === 6 && "17:00"}
                  {para.paraNum === 7 && "18:40"}
                </td>
                <td className="td-schedule">
                  {(() => {
                    let type = "";
                    let name = "";
                    if (para.lectureName) { type = "Л."; name = para.lectureName;  }
                    else if (para.labName) { type = "Лаб."; name = para.labName; }
                    else if (para.practicName) { type = "Пр."; name = para.practicName; }
                    return `${name}, ${type}`;
                  })()}
                  <br/>
                  {para.teacherNames?.join(", ")}
                  <br/>
                 
                </td>
                <td className="td-schedule">{para.cabinetNames?.join(", ")}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
