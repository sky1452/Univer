package handlers

import (
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"golang.org/x/crypto/bcrypt"
)

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Role     int    `json:"role"`
}

type LoginResponse struct {
	Success     bool   `json:"success"`
	Message     string `json:"message,omitempty"`
	Role        int    `json:"role"`
	FullName    string `json:"fullName,omitempty"`
	Email       string `json:"email,omitempty"`
	Position    string `json:"position,omitempty"`
	Departament string `json:"departament,omitempty"`
	Stazh       int    `json:"stazh,omitempty"`
	Dop         string `json:"dop,omitempty"`
	Avatar      string `json:"avatar,omitempty"`
	UserID      int    `json:"userId,omitempty"`
}

func (h *Handler) LoginHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(LoginResponse{
			Success: false,
			Message: "Метод не поддерживается",
		})
		return
	}

	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(LoginResponse{
			Success: false,
			Message: "Неверный формат запроса",
		})
		return
	}

	if req.Email == "" || req.Password == "" || req.Role == 0 {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(LoginResponse{
			Success: false,
			Message: "Email, пароль и роль обязательны",
		})
		return
	}

	log.Printf("DEBUG: login attempt email='%s' role=%d", req.Email, req.Role)

	var userID int
	var hashedPassword, fullName, email, position, departament string
	var roleFromDB int
	var stazh sql.NullInt64
	var dop sql.NullString
	var avatarBytes []byte

	err := h.DB.QueryRow(r.Context(),
		`SELECT user_id,
		        password,
		        role_id,
		        name,
		        email,
		        COALESCE(properties->>'position', ''),
		        COALESCE(properties->>'departament', ''),
		        stazh,
		        dop,
		        avatar
		 FROM users
		 WHERE email = $1`,
		req.Email,
	).Scan(
		&userID,
		&hashedPassword,
		&roleFromDB,
		&fullName,
		&email,
		&position,
		&departament,
		&stazh,
		&dop,
		&avatarBytes,
	)

	if err != nil {
		log.Printf("[Login failed] Query error for email='%s': %v", req.Email, err)
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(LoginResponse{
			Success: false,
			Message: "Пользователь не найден",
		})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(req.Password)); err != nil {
		log.Printf("[Login failed] Неверный пароль для пользователя: %s (%s)", req.Email, fullName)
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(LoginResponse{
			Success: false,
			Message: "Неверный пароль",
		})
		return
	}

	if req.Role != roleFromDB {
		log.Printf("[Login failed] Роль не совпадает для пользователя: %s (%s). Ожидалось %d, пришло %d",
			req.Email, fullName, roleFromDB, req.Role)
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(LoginResponse{
			Success: false,
			Message: fmt.Sprintf("Роль не совпадает: ожидалось %d, пришло %d", roleFromDB, req.Role),
		})
		return
	}

	realStazh := 0
	if stazh.Valid {
		realStazh = int(stazh.Int64)
	}

	realDop := ""
	if dop.Valid {
		realDop = dop.String
	}

	avatarData := ""
	if len(avatarBytes) > 0 {
		avatarData = "data:image/jpeg;base64," + base64.StdEncoding.EncodeToString(avatarBytes)
	}

	log.Printf("[Login success] Пользователь вошёл: %s (%s)", req.Email, fullName)

	json.NewEncoder(w).Encode(LoginResponse{
		Success:     true,
		Role:        roleFromDB,
		FullName:    fullName,
		Email:       email,
		Position:    position,
		Departament: departament,
		Stazh:       realStazh,
		Dop:         realDop,
		Avatar:      avatarData,
		UserID:      userID,
	})
}