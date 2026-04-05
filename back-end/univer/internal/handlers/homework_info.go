package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
)

type ProgressResponse struct {
	Success      bool `json:"success"`
	UserID       int  `json:"userId"`
	StudentID    int  `json:"studentId"`
	DisciplineID int  `json:"disciplineId"`
	Progress     int  `json:"progress"`
}

func (h *Handler) GetStudentProgressHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	ctx := r.Context()

	vars := mux.Vars(r)

	userIDStr := vars["userId"]
	disciplineIDStr := vars["disciplineId"]

	if userIDStr == "" || disciplineIDStr == "" {
		http.Error(w, "userId and disciplineId are required", http.StatusBadRequest)
		return
	}

	studentID, err := strconv.Atoi(userIDStr)
	if err != nil {
		http.Error(w, "Некорректный userId", http.StatusBadRequest)
		return
	}

	disciplineID, err := strconv.Atoi(disciplineIDStr)
	if err != nil {
		http.Error(w, "Некорректный disciplineId", http.StatusBadRequest)
		return
	}

	var progress int
	err = h.DB.QueryRow(ctx, `
		SELECT COUNT(DISTINCT s.task_id)
		FROM submissions s
		JOIN homeworks h ON s.task_id = h.id
		WHERE s.student_id = $1
		  AND h.discipline_id = $2
	`, studentID, disciplineID).Scan(&progress)

	if err != nil {
		http.Error(w, fmt.Sprintf("Ошибка при подсчёте прогресса: %v", err), http.StatusInternalServerError)
		return
	}

	resp := ProgressResponse{
		Success:      true,
		UserID:       studentID,
		StudentID:    studentID,
		DisciplineID: disciplineID,
		Progress:     progress,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}