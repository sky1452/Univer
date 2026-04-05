package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
)

type UpdateSubmissionScoreRequest struct {
	Score *int `json:"score"`
}

func (h *Handler) UpdateSubmissionScoreHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	ctx := context.Background()
	vars := mux.Vars(r)

	submissionIDStr := vars["submissionId"]
	if submissionIDStr == "" {
		http.Error(w, "submissionId is required", http.StatusBadRequest)
		return
	}

	submissionID, err := strconv.Atoi(submissionIDStr)
	if err != nil {
		http.Error(w, "invalid submissionId", http.StatusBadRequest)
		return
	}

	var req UpdateSubmissionScoreRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}

	if req.Score == nil {
		http.Error(w, "score is required", http.StatusBadRequest)
		return
	}

	if *req.Score < 0 {
		http.Error(w, "score cannot be negative", http.StatusBadRequest)
		return
	}

	var maxScore int
	err = h.DB.QueryRow(ctx, `
		SELECT hw.max_score
		FROM submissions s
		JOIN homeworks hw ON hw.id = s.task_id
		WHERE s.id = $1
	`, submissionID).Scan(&maxScore)
	if err != nil {
		http.Error(w, "failed to get max_score", http.StatusInternalServerError)
		return
	}

	if *req.Score > maxScore {
		http.Error(w, "score exceeds max_score", http.StatusBadRequest)
		return
	}

	_, err = h.DB.Exec(ctx, `
		UPDATE submissions
		SET score = $1
		WHERE id = $2
	`, *req.Score, submissionID)
	if err != nil {
		http.Error(w, "failed to update score", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"success": true,
		"score":   *req.Score,
	})
}