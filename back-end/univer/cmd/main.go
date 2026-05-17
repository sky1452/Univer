package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	_ "univer/docs"
	"univer/internal/config"
	"univer/internal/handlers"
	"univer/pkg/db"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	httpSwagger "github.com/swaggo/http-swagger"
)

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func main() {
	fmt.Println("Server started")

	if err := godotenv.Load(".env"); err != nil {
		log.Println("Warning: .env file not found")
	}

	cfg, err := config.LoadConfig("internal/config/config.yaml")
	if err != nil {
		log.Fatalf("Ошибка загрузки конфигурации: %v", err)
	}

	if databaseURL := os.Getenv("DATABASE_URL"); databaseURL != "" {
		cfg.Database.DSN = databaseURL
	}

	conn, err := db.ConnectDB(cfg.Database.DSN)
	if err != nil {
		log.Fatalf("Ошибка подключения к базе данных: %v", err)
	}
	defer conn.Close()

	sess := session.Must(session.NewSession(&aws.Config{
		Region:           aws.String("ru-central1"),
		Endpoint:         aws.String("https://storage.yandexcloud.net"),
		S3ForcePathStyle: aws.Bool(true),
		Credentials: credentials.NewStaticCredentials(
			os.Getenv("YANDEX_ACCESS_KEY"),
			os.Getenv("YANDEX_SECRET_KEY"),
			"",
		),
	}))

	s3Client := s3.New(sess)

	router := mux.NewRouter()
	h := handlers.NewHandler(conn.Pool, cfg, s3Client)

	router.Use(corsMiddleware)

	router.Methods(http.MethodOptions).HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.WriteHeader(http.StatusOK)
	})

	router.HandleFunc("/", h.HomeHandler).Methods("GET")
	router.HandleFunc("/teachers", h.GetAllTeachersHandler).Methods("GET")
	router.HandleFunc("/teacher/{id}", h.GetTeacherByIDHandler).Methods("GET")
	router.HandleFunc("/student/{id}", h.GetStudentByIDHandler).Methods("GET")
	router.HandleFunc("/students/{group}", h.GetStudentsByGroupHandler).Methods("GET")
	router.HandleFunc("/groups", h.GetAllGroups).Methods("GET")
	router.HandleFunc("/labs", h.GetAllLabs).Methods("GET")
	router.HandleFunc("/currentWeekType", h.GetWeekType).Methods("GET")
	router.HandleFunc("/teacher/add", h.AddTeacherHandler).Methods("POST")
	router.HandleFunc("/paraNum", h.GetParaNum).Methods("GET")
	router.HandleFunc("/myPara", h.MyCurrentPara).Methods("GET")
	router.HandleFunc("/myGroup/{id}", h.GetMyGroupById).Methods("GET")
	router.HandleFunc("/myTodayParas/{id}", h.MyTodayParas).Methods("GET")
	router.HandleFunc("/mySchedule/{id}", h.MySchedule).Methods("GET")
	router.HandleFunc("/para", h.MySchedule).Methods("GET")

	router.HandleFunc("/api/login", h.LoginHandler).Methods("POST", "OPTIONS")
	router.HandleFunc("/api/update-user", h.UpdateStazhHandler).Methods("PUT", "OPTIONS")
	router.HandleFunc("/api/update-dop", h.UpdateDopHandler).Methods("PUT", "OPTIONS")
	router.HandleFunc("/api/update-avatar", h.UpdateAvatarHandler).Methods("PUT", "OPTIONS")
	router.HandleFunc("/grades", h.UpdateGradesHandler).Methods("PUT", "OPTIONS")
	router.HandleFunc("/grades/{group}/{discipline}", h.GetGradesHandler).Methods("GET")
	router.HandleFunc("/studentGrades/{studentId}", h.GetStudentGrades).Methods("GET")
	router.HandleFunc("/studentSchedule/{studentId}", h.MySchedule).Methods("GET")
	router.HandleFunc("/discipline/{disciplineId}/student/{userId}", h.GetStudentHomeworks)
	router.HandleFunc("/discipline/{disciplineId}", h.GetDisciplineById).Methods("GET")
	router.HandleFunc("/createHomework", h.CreateHomeworkHandler).Methods("POST")
	router.HandleFunc("/getHomeworks", h.GetHomeworks).Methods("GET")
	router.HandleFunc("/tasks/{id}", h.GetHomeworkByID).Methods("GET")
	router.HandleFunc("/submissions", h.UploadSubmission).Methods("POST", "OPTIONS")
	router.HandleFunc("/progress/{userId}/{disciplineId}", h.GetStudentProgressHandler).Methods("GET")
	router.HandleFunc("/tasks/{taskId}/student/{userId}/files", h.GetStudentSubmissionFilesHandler).Methods("GET")
	router.HandleFunc("/tasks/{taskId}/student/{userId}/files/{fileIndex}/download", h.DownloadStudentSubmissionFileHandler).Methods("GET")
	router.PathPrefix("/swagger/").Handler(httpSwagger.WrapHandler)
	router.HandleFunc("/getHomeworks/{userId}/{group}/{disciplineId}", h.GetHomeworksByFilters)
	router.HandleFunc("/getHomework/{userId}/{group}/{disciplineId}/{homeworkId}", h.GetHomeworkByIDAndFilters).Methods("GET")
	router.HandleFunc("/homeworks/{taskId}/group/{group}/submissions", h.GetHomeworkSubmissionsByGroup).Methods("GET")
	router.HandleFunc("/submissions/{submissionId}/score", h.UpdateSubmissionScoreHandler).Methods("PUT")
	router.HandleFunc("/tasks/{taskId}/student/{userId}/score", h.GetStudentSubmissionScoreHandler).Methods("GET")
	router.HandleFunc("/tasks/{taskId}/student/{userId}/submission", h.UpdateHomeworkAnswer).Methods("PUT")
	router.HandleFunc("/homeworks/{homeworkId}/teacher/{teacherId}", h.DeleteHomework).Methods("DELETE")
	router.HandleFunc("/homeworks/{homeworkId}/teacher/{teacherId}", h.UpdateHomework).Methods("PUT")

	port := os.Getenv("PORT")
	if port == "" {
		port = fmt.Sprintf("%d", cfg.Server.Port)
	}

	addr := ":" + port
	log.Println("Сервер запущен на", addr)
	log.Fatal(http.ListenAndServe(addr, router))
}
