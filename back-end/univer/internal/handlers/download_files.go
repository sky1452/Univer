package handlers

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"

	"github.com/gorilla/mux"
)

type fileItem struct {
	FileURL  string
	FileName string
}

func extractFileNameFromURLDownload(fileURL string) string {
	parts := strings.Split(fileURL, "/")
	if len(parts) == 0 {
		return ""
	}

	lastPart := parts[len(parts)-1]
	if lastPart == "" {
		return ""
	}

	decodedName, err := url.PathUnescape(lastPart)
	if err != nil {
		decodedName = lastPart
	}

	underscoreIndex := strings.Index(decodedName, "_")
	if underscoreIndex == -1 || underscoreIndex+1 >= len(decodedName) {
		return decodedName
	}

	return decodedName[underscoreIndex+1:]
}

func sanitizeASCIIFileName(name string) string {
	replacer := strings.NewReplacer(
		`"`, "",
		"\r", "",
		"\n", "",
	)
	return replacer.Replace(name)
}

func (h *Handler) buildStudentTaskFiles(ctx context.Context, taskID int, studentID int) ([]fileItem, error) {
	submissionRows, err := h.DB.Query(ctx, `
		SELECT id
		FROM submissions
		WHERE task_id = $1 AND student_id = $2
		ORDER BY id DESC
	`, taskID, studentID)
	if err != nil {
		return nil, err
	}
	defer submissionRows.Close()

	var files []fileItem

	for submissionRows.Next() {
		var submissionID int

		if err := submissionRows.Scan(&submissionID); err != nil {
			return nil, err
		}

		fileRows, err := h.DB.Query(ctx, `
			SELECT file_url
			FROM submission_files
			WHERE submission_id = $1
			ORDER BY id
		`, submissionID)
		if err != nil {
			return nil, err
		}

		for fileRows.Next() {
			var fileURL string

			if err := fileRows.Scan(&fileURL); err != nil {
				fileRows.Close()
				return nil, err
			}

			files = append(files, fileItem{
				FileURL:  fileURL,
				FileName: extractFileNameFromURLDownload(fileURL),
			})
		}

		if err := fileRows.Err(); err != nil {
			fileRows.Close()
			return nil, err
		}

		fileRows.Close()
	}

	if err := submissionRows.Err(); err != nil {
		return nil, err
	}

	return files, nil
}

func (h *Handler) DownloadStudentSubmissionFileHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	ctx := r.Context()
	vars := mux.Vars(r)

	taskIDStr := vars["taskId"]
	userIDStr := vars["userId"]
	fileIndexStr := vars["fileIndex"]

	if taskIDStr == "" || userIDStr == "" || fileIndexStr == "" {
		http.Error(w, "taskId, userId and fileIndex are required", http.StatusBadRequest)
		return
	}

	taskID, err := strconv.Atoi(taskIDStr)
	if err != nil {
		http.Error(w, "Некорректный taskId", http.StatusBadRequest)
		return
	}

	studentID, err := strconv.Atoi(userIDStr)
	if err != nil {
		http.Error(w, "Некорректный userId", http.StatusBadRequest)
		return
	}

	fileIndex, err := strconv.Atoi(fileIndexStr)
	if err != nil || fileIndex < 0 {
		http.Error(w, "Некорректный fileIndex", http.StatusBadRequest)
		return
	}

	files, err := h.buildStudentTaskFiles(ctx, taskID, studentID)
	if err != nil {
		http.Error(w, fmt.Sprintf("Ошибка получения файлов: %v", err), http.StatusInternalServerError)
		return
	}

	if fileIndex >= len(files) {
		http.Error(w, "Файл не найден", http.StatusNotFound)
		return
	}

	selectedFile := files[fileIndex]

	resp, err := http.Get(selectedFile.FileURL)
	if err != nil {
		http.Error(w, fmt.Sprintf("Ошибка скачивания файла: %v", err), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		http.Error(w, fmt.Sprintf("Ошибка хранилища: %d", resp.StatusCode), http.StatusBadGateway)
		return
	}

	safeFileName := sanitizeASCIIFileName(selectedFile.FileName)

	w.Header().Set(
		"Content-Disposition",
		fmt.Sprintf(
			`attachment; filename="%s"; filename*=UTF-8''%s`,
			safeFileName,
			url.PathEscape(selectedFile.FileName),
		),
	)

	if contentType := resp.Header.Get("Content-Type"); contentType != "" {
		w.Header().Set("Content-Type", contentType)
	} else {
		w.Header().Set("Content-Type", "application/octet-stream")
	}

	if resp.Header.Get("Content-Length") != "" {
		w.Header().Set("Content-Length", resp.Header.Get("Content-Length"))
	}

	_, err = io.Copy(w, resp.Body)
	if err != nil {
		http.Error(w, fmt.Sprintf("Ошибка при отправке файла: %v", err), http.StatusInternalServerError)
		return
	}
}