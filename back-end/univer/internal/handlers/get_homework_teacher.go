package handlers

import (
    "context"
    "encoding/json"
    "log"
    "net/http"
    "strconv"
    "time"

    "github.com/gorilla/mux"
)

type Homework3 struct {
    ID           int       `json:"id"`
    Title        string    `json:"title"`
    Description  string    `json:"description"`
    MaxScore     int       `json:"max_score"`
    Deadline     time.Time `json:"deadline"`
    DisciplineID int       `json:"discipline_id"`
    GroupID      int       `json:"group_id"`
    TeacherID    int       `json:"teacher_id"`
    CreatedAt    time.Time `json:"created_at"`
    UpdatedAt    time.Time `json:"updated_at"`
}

func (h *Handler) GetHomeworksByFilters(w http.ResponseWriter, r *http.Request) {
    ctx := context.Background()
    vars := mux.Vars(r)

    userIdStr := vars["userId"]
    groupName := vars["group"]
    disciplineIdStr := vars["disciplineId"]

    if userIdStr == "" || groupName == "" || disciplineIdStr == "" {
        http.Error(w, "missing params", http.StatusBadRequest)
        return
    }

    userId, err := strconv.Atoi(userIdStr)
    if err != nil {
        http.Error(w, "invalid userId", http.StatusBadRequest)
        return
    }

    disciplineId, err := strconv.Atoi(disciplineIdStr)
    if err != nil {
        http.Error(w, "invalid disciplineId", http.StatusBadRequest)
        return
    }

    // --- teacher_id напрямую ---
    teacherId := userId

    // --- ищем group_id ---
    var groupId int
    err = h.DB.QueryRow(ctx,
        `SELECT id FROM "group" WHERE name = $1`,
        groupName,
    ).Scan(&groupId)
    if err != nil {
        log.Println("Ошибка получения group_id:", err)
        http.Error(w, "failed to get group_id", http.StatusInternalServerError)
        return
    }

    // --- основной запрос ---
    rows, err := h.DB.Query(ctx, `
        SELECT 
            id,
            title,
            description,
            max_score,
            deadline,
            discipline_id,
            group_id,
            teacher_id,
            created_at,
            updated_at
        FROM homeworks
        WHERE teacher_id = $1
          AND group_id = $2
          AND discipline_id = $3
        ORDER BY created_at DESC
    `, teacherId, groupId, disciplineId)
    if err != nil {
        log.Println("Ошибка запроса homeworks:", err)
        http.Error(w, "failed to get homeworks", http.StatusInternalServerError)
        return
    }
    defer rows.Close()

    var homeworks []Homework3

    for rows.Next() {
        var hw Homework3
        err := rows.Scan(
            &hw.ID,
            &hw.Title,
            &hw.Description,
            &hw.MaxScore,
            &hw.Deadline,
            &hw.DisciplineID,
            &hw.GroupID,
            &hw.TeacherID,
            &hw.CreatedAt,
            &hw.UpdatedAt,
        )
        if err != nil {
            log.Println("Ошибка scan:", err)
            http.Error(w, "failed to scan", http.StatusInternalServerError)
            return
        }
        homeworks = append(homeworks, hw)
    }

    if err := rows.Err(); err != nil {
        log.Println("Ошибка rows:", err)
        http.Error(w, "rows error", http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(homeworks)
}