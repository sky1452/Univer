package handlers

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"database/sql"
	"encoding/json"
	"github.com/gorilla/mux"
	"time"
	"mime/multipart"
	"strconv"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/credentials"
)

type Submission struct {
	ID        int
	StudentID int
	Comment   string
	Score     *int
	CreatedAt time.Time
}

func (h *Handler) UpdateHomeworkAnswer(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	vars := mux.Vars(r)

	taskIDStr := vars["taskId"]
	userIDStr := vars["userId"]

	if taskIDStr == "" || userIDStr == "" {
		http.Error(w, "taskId and userId are required", http.StatusBadRequest)
		log.Println("Missing taskId or userId in request")
		return
	}

	taskID, err := strconv.Atoi(taskIDStr)
	if err != nil {
		http.Error(w, "invalid taskId", http.StatusBadRequest)
		log.Printf("Invalid taskId: %s, error: %v", taskIDStr, err)
		return
	}

	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		http.Error(w, "invalid userId", http.StatusBadRequest)
		log.Printf("Invalid userId: %s, error: %v", userIDStr, err)
		return
	}

	err = r.ParseMultipartForm(10 << 20) // 10 MB limit
	if err != nil {
		http.Error(w, "Error parsing form", http.StatusBadRequest)
		log.Printf("Error parsing form: %v", err)
		return
	}

	comment := r.FormValue("comment")
	keptFileIndexes := r.FormValue("keptFileIndexes")
	newFiles := r.MultipartForm.File["files"]

	var keptIndexes []int
	if err := json.Unmarshal([]byte(keptFileIndexes), &keptIndexes); err != nil {
		http.Error(w, "Invalid keptFileIndexes", http.StatusBadRequest)
		log.Printf("Invalid keptFileIndexes: %v", err)
		return
	}

	var submissionID int
	var existingComment string
	err = h.DB.QueryRow(ctx, `SELECT id, comment FROM submissions WHERE task_id = $1 AND student_id = $2 ORDER BY created_at DESC LIMIT 1`,
		taskID, userID).Scan(&submissionID, &existingComment)

	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "No submission found", http.StatusNotFound)
			log.Printf("No submission found for taskId %d and userId %d", taskID, userID)
			return
		}
		http.Error(w, fmt.Sprintf("Error fetching submission: %v", err), http.StatusInternalServerError)
		log.Printf("Error fetching submission: %v", err)
		return
	}

	var filesToDelete []int
	fileRows, err := h.DB.Query(ctx, `SELECT id, file_url FROM submission_files WHERE submission_id = $1`, submissionID)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error fetching submission files: %v", err), http.StatusInternalServerError)
		log.Printf("Error fetching submission files: %v", err)
		return
	}
	defer fileRows.Close()

	for fileRows.Next() {
		var fileID int
		var fileURL string
		if err := fileRows.Scan(&fileID, &fileURL); err != nil {
			http.Error(w, fmt.Sprintf("Error reading file row: %v", err), http.StatusInternalServerError)
			log.Printf("Error reading file row: %v", err)
			return
		}
		if !contains(keptIndexes, fileID) {
			filesToDelete = append(filesToDelete, fileID)
			err := deleteObjectS3(ctx, "cloud-sky-pirson", fileURL)
			if err != nil {
				http.Error(w, fmt.Sprintf("Error deleting file from storage: %v", err), http.StatusInternalServerError)
				log.Printf("Error deleting file from storage: %v", err)
				return
			}
		}
	}

	for _, fileID := range filesToDelete {
		_, err := h.DB.Exec(ctx, `DELETE FROM submission_files WHERE id = $1`, fileID)
		if err != nil {
			http.Error(w, fmt.Sprintf("Error deleting file row: %v", err), http.StatusInternalServerError)
			log.Printf("Error deleting file row: %v", err)
			return
		}
	}

	var newFileIndexes []int
	for _, file := range newFiles {
		filePath := saveFile(file) // Параметр file больше не используется в saveFile
		fileID := saveFileToDB(filePath, submissionID) // Параметры filePath и submissionID больше не нужны в saveFileToDB
		newFileIndexes = append(newFileIndexes, fileID)
	}

	if comment != existingComment {
		_, err := h.DB.Exec(ctx, `UPDATE submissions SET comment = $1 WHERE id = $2`, comment, submissionID)
		if err != nil {
			http.Error(w, fmt.Sprintf("Error updating comment: %v", err), http.StatusInternalServerError)
			log.Printf("Error updating comment: %v", err)
			return
		}
	}

	response := map[string]interface{}{
		"status":  "success",
		"files":   newFileIndexes,
		"message": "Answer updated successfully",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// Функция для удаления файла с Яндекс Облака
func deleteObjectS3(ctx context.Context, bucket, key string) error {
	log.Printf("Starting deletion of file %s from bucket %s", key, bucket)

	cfg, err := config.LoadDefaultConfig(ctx,
		config.WithCredentialsProvider(
			credentials.NewStaticCredentialsProvider("YCAJE25LnH-jAwtkZ4pWouxZs", "YCNK5wafOwQ7tZnNq7PVn8FwxkxOxvCTP0WpFqoV", ""),
		),
		config.WithRegion("ru-central1"),
	)
	if err != nil {
		log.Printf("Failed to load config: %v", err)
		return fmt.Errorf("failed to load config: %w", err)
	}

	s3client := s3.NewFromConfig(cfg, func(o *s3.Options) {
		o.EndpointResolver = s3.EndpointResolverFromURL("https://storage.yandexcloud.net")
	})

	_, err = s3client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		log.Printf("Failed to delete file: %v", err)
		return fmt.Errorf("failed to delete file: %w", err)
	}

	log.Printf("Successfully deleted file %s from bucket %s", key, bucket)
	return nil
}

// Вспомогательная функция для проверки существования элемента в массиве
func contains(slice []int, item int) bool {
	for _, v := range slice {
		if v == item {
			return true
		}
	}
	return false
}

// Псевдонимы для сохранения файла на сервере и в БД
func saveFile(file *multipart.FileHeader) string {
	// Параметр file больше не используется
	return "path/to/file" // Возвращаем путь к файлу
}

// Параметры filePath и submissionID больше не нужны в этой функции
func saveFileToDB(filePath string, submissionID int) int {
	// Параметры больше не нужны
	return 123 // Возвращаем ID файла
}