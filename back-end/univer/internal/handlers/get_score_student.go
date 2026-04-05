package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
)

type StudentSubmissionScoreResponse struct {
	Score *int `json:"score"`
}

func (h *Handler) GetStudentSubmissionScoreHandler(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()
	vars := mux.Vars(r)

	taskIDStr := vars["taskId"]
	userIDStr := vars["userId"]

	if taskIDStr == "" || userIDStr == "" {
		http.Error(w, "taskId and userId are required", http.StatusBadRequest)
		return
	}

	taskID, err := strconv.Atoi(taskIDStr)
	if err != nil {
		http.Error(w, "invalid taskId", http.StatusBadRequest)
		return
	}

	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		http.Error(w, "invalid userId", http.StatusBadRequest)
		return
	}

	var score *int

	err = h.DB.QueryRow(ctx, `
		SELECT score
		FROM submissions
		WHERE task_id = $1 AND student_id = $2
		ORDER BY id DESC
		LIMIT 1
	`, taskID, userID).Scan(&score)

	if err != nil {
		resp := StudentSubmissionScoreResponse{
			Score: nil,
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
		return
	}

	resp := StudentSubmissionScoreResponse{
		Score: score,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}