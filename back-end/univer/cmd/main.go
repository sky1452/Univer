package main

import (
	"fmt"
	"log"
	"net/http"
	"univer/internal/config"
	"univer/internal/handlers"
	"univer/pkg/db"

	"github.com/gorilla/mux"
	httpSwagger "github.com/swaggo/http-swagger"
	_ "univer/docs"
	
)

// @title Univer	
// @version 1.0
// @description Приложение для автоматизации учебных процессов
// @host localhost:8081

// corsMiddleware добавляет CORS-заголовки и обрабатывает preflight
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Разрешаем фронт React
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		// Preflight OPTIONS
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func main() {
	fmt.Println("Server started")

	// 🔹 Загружаем конфиг
	cfg, err := config.LoadConfig("C:/Users/юрий/Desktop/my project/back-end/univer/internal/config/config.yaml")
	if err != nil {
		log.Fatalf("Ошибка загрузки конфигурации: %v", err)
	}

	// 🔹 Подключаемся к БД
	conn, err := db.ConnectDB(cfg.Database.DSN)
	if err != nil {
		log.Fatalf("Ошибка подключения к базе данных: %v", err)
	}
	defer conn.Close()

	// 🔹 Создаём роутер
	router := mux.NewRouter()

	// 🔹 Создаём хендлеры с передачей БД и конфига
	h := handlers.NewHandler(conn.Pool, cfg)

	// 🔹 Применяем CORS middleware до регистрации маршрутов
	router.Use(corsMiddleware)

	// 🔹 Универсальный OPTIONS для всех путей
	router.Methods(http.MethodOptions).HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.WriteHeader(http.StatusOK)
	})

	// 🔹 Регистрируем маршруты
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
	// 🔹 Swagger
	router.PathPrefix("/swagger/").Handler(httpSwagger.WrapHandler)

	// 🔹 Запускаем сервер
	addr := fmt.Sprintf(":%d", cfg.Server.Port)
	log.Println("Сервер запущен на", addr)
	log.Fatal(http.ListenAndServe(addr, router))
}