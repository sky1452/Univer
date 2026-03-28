package handlers

import (
    "context"
    "encoding/json"
    "errors"
    "log"
    "net/http"
    "strconv"
    "time"

    "github.com/gorilla/mux"
    "github.com/jackc/pgx/v5"
)

type Homework2 struct {
    ID           int       `json:"id"`
    Title        string    `json:"title"`
    Description  string    `json:"description"`
    MaxScore     int       `json:"max_score"`
    Deadline     time.Time `json:"deadline"`
    DisciplineID int       `json:"discipline_id"`
}

func (h *Handler) GetHomeworkByID(w http.ResponseWriter, r *http.Request) {
    vars := mux.Vars(r)

    // 🔹 Парсим ID из URL
    homeworkID, err := strconv.Atoi(vars["id"])
    if err != nil {
        http.Error(w, "invalid homework id", http.StatusBadRequest)
        return
    }

    var hw Homework2

    // 🔹 Контекст с таймаутом (лучше сразу нормально сделать)
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    // 🔹 Запрос к БД
    err = h.DB.QueryRow(ctx, `
        SELECT 
            id,
            title,
            description,
            max_score,
            deadline,
            discipline_id
        FROM homeworks
        WHERE id = $1
    `, homeworkID).Scan(
        &hw.ID,
        &hw.Title,
        &hw.Description,
        &hw.MaxScore,
        &hw.Deadline,
        &hw.DisciplineID,
    )

    // 🔹 Обработка ошибок
    if err != nil {
        log.Println("Ошибка получения задания:", err)

        w.Header().Set("Content-Type", "application/json")

        if errors.Is(err, pgx.ErrNoRows) {
            w.WriteHeader(http.StatusNotFound)
            json.NewEncoder(w).Encode(map[string]string{
                "error": "Задание не найдено",
            })
            return
        }

        w.WriteHeader(http.StatusInternalServerError)
        json.NewEncoder(w).Encode(map[string]string{
            "error": "Ошибка получения задания",
        })
        return
    }

    // 🔹 Успешный ответ
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)

    json.NewEncoder(w).Encode(hw)
}