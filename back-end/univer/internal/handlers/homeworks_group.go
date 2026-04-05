package handlers

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"sort"
	"strconv"
	"time"

	"github.com/gorilla/mux"
)

type SubmissionFileResponse1 struct {
	FileIndex int    `json:"file_index"`
	FileName  string `json:"file_name"`
}

type SubmissionResponse struct {
	SubmissionID int       `json:"submission_id"`
	Comment      string    `json:"comment"`
	Score        *int      `json:"score"`
	CreatedAt    time.Time `json:"created_at"`
}

type StudentSubmissionGroupResponse struct {
	StudentID     int                       `json:"student_id"`
	StudentName   string                    `json:"student_name"`
	Submitted     bool                      `json:"submitted"`
	LatestComment string                    `json:"latest_comment"`
	Submissions   []SubmissionResponse      `json:"submissions"`
	Files         []SubmissionFileResponse1 `json:"files"`
}

func (h *Handler) GetHomeworkSubmissionsByGroup(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()
	vars := mux.Vars(r)

	taskIDStr := vars["taskId"]
	groupName := vars["group"]

	if taskIDStr == "" || groupName == "" {
		http.Error(w, "taskId and group are required", http.StatusBadRequest)
		return
	}

	taskID, err := strconv.Atoi(taskIDStr)
	if err != nil {
		http.Error(w, "invalid taskId", http.StatusBadRequest)
		return
	}

	var groupID int
	err = h.DB.QueryRow(ctx,
		`SELECT id FROM "group" WHERE name = $1`,
		groupName,
	).Scan(&groupID)
	if err != nil {
		log.Println("Ошибка получения group_id:", err)
		http.Error(w, "failed to get group_id", http.StatusInternalServerError)
		return
	}

	type studentRow struct {
		ID   int
		Name string
	}

	studentRows, err := h.DB.Query(ctx, `
		SELECT u.user_id, u.name
		FROM users u
		WHERE u.properties->>'group' = $1
		ORDER BY u.name
	`, groupName)
	if err != nil {
		log.Println("Ошибка получения студентов группы:", err)
		http.Error(w, "failed to get students", http.StatusInternalServerError)
		return
	}
	defer studentRows.Close()

	students := make([]studentRow, 0)

	for studentRows.Next() {
		var s studentRow

		if err := studentRows.Scan(&s.ID, &s.Name); err != nil {
			log.Println("Ошибка scan студентов:", err)
			http.Error(w, "failed to scan students", http.StatusInternalServerError)
			return
		}

		students = append(students, s)
	}

	if err := studentRows.Err(); err != nil {
		log.Println("Ошибка rows студентов:", err)
		http.Error(w, "students rows error", http.StatusInternalServerError)
		return
	}

	type dbSubmission struct {
		ID        int
		StudentID int
		Comment   string
		Score     *int
		CreatedAt time.Time
	}

	submissionRows, err := h.DB.Query(ctx, `
		SELECT id, student_id, comment, score, created_at
		FROM submissions
		WHERE task_id = $1 AND group_id = $2
		ORDER BY id DESC
	`, taskID, groupID)
	if err != nil {
		log.Println("Ошибка получения submissions:", err)
		http.Error(w, "failed to get submissions", http.StatusInternalServerError)
		return
	}
	defer submissionRows.Close()

	submissionsByStudent := make(map[int][]dbSubmission)

	for submissionRows.Next() {
		var sub dbSubmission

		if err := submissionRows.Scan(
			&sub.ID,
			&sub.StudentID,
			&sub.Comment,
			&sub.Score,
			&sub.CreatedAt,
		); err != nil {
			log.Println("Ошибка scan submissions:", err)
			http.Error(w, "failed to scan submissions", http.StatusInternalServerError)
			return
		}

		submissionsByStudent[sub.StudentID] = append(submissionsByStudent[sub.StudentID], sub)
	}

	if err := submissionRows.Err(); err != nil {
		log.Println("Ошибка rows submissions:", err)
		http.Error(w, "submissions rows error", http.StatusInternalServerError)
		return
	}

	result := make([]StudentSubmissionGroupResponse, 0, len(students))

	for _, student := range students {
		studentSubs := submissionsByStudent[student.ID]

		sort.Slice(studentSubs, func(i, j int) bool {
			return studentSubs[i].ID > studentSubs[j].ID
		})

		studentFiles, err := h.buildStudentTaskFiles(ctx, taskID, student.ID)
		if err != nil {
			log.Println("Ошибка получения файлов студента:", err)
			http.Error(w, "failed to get student files", http.StatusInternalServerError)
			return
		}

		indexedFiles := make([]SubmissionFileResponse1, 0, len(studentFiles))
		for i, file := range studentFiles {
			indexedFiles = append(indexedFiles, SubmissionFileResponse1{
				FileIndex: i,
				FileName:  file.FileName,
			})
		}

		respSubs := make([]SubmissionResponse, 0, len(studentSubs))
		latestComment := ""

		for _, sub := range studentSubs {
			respSubs = append(respSubs, SubmissionResponse{
				SubmissionID: sub.ID,
				Comment:      sub.Comment,
				Score:        sub.Score,
				CreatedAt:    sub.CreatedAt,
			})

			if latestComment == "" && sub.Comment != "" {
				latestComment = sub.Comment
			}
		}

		result = append(result, StudentSubmissionGroupResponse{
			StudentID:     student.ID,
			StudentName:   student.Name,
			Submitted:     len(respSubs) > 0,
			LatestComment: latestComment,
			Submissions:   respSubs,
			Files:         indexedFiles,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}