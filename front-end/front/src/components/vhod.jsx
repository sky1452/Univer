import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from "lucide-react";
export default function Login() {
  // selectedRole теперь будет числом: 3 — студент, 2 — преподаватель
  const [selectedRole, setSelectedRole] = useState(null);
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const handleRoleSelect = (role) => {
    // role — строка 'student' или 'teacher', переводим в число
    if (role === 'student') setSelectedRole(3);
    else if (role === 'teacher') setSelectedRole(2);
    else setSelectedRole(null);

    setErrorVisible(false);
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;

    if (!selectedRole) {
      setErrorVisible(true);
      setErrorMessage('Пожалуйста, выберите роль');
      return;
    }

    try {
      const response = await fetch("http://localhost:8081/api/login", {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password, role: selectedRole }),
});
 
      const data = await response.json();

    if (response.ok && data.success) {
        setErrorVisible(false);
       

        //сохраняем данные в localStorage
        localStorage.setItem('user', JSON.stringify({
          role: selectedRole,
         
          fullName: data.fullName,
          email: data.email,
          position: data.position,
          departament: data.departament,
          stazh: data.stazh != null ? data.stazh : 0,
          dop: data.dop != null ? data.dop : null,
          avatar: data.avatar,
          userId: data.userId
        }));
        if(selectedRole === 3) navigate('/profile_student');
        else if(selectedRole === 2)
        navigate('/profile_teacher');
    } else {
      setErrorVisible(true);
      setErrorMessage(data.message || 'Неверный логин или пароль');
    }
  } catch (err) {
    setErrorVisible(true);
    setErrorMessage('Ошибка сети');
  }
};

  return ( 
  <div className="login-page">
    <div className="role-selection">
      <div className="rectangle" onClick={() => handleRoleSelect('student')}>
        <h2>Я студент</h2>
      </div>
      <div className="rectangle" onClick={() => handleRoleSelect('teacher')}>
        <h2>Я преподаватель</h2>
      </div>
    </div>

    {selectedRole && (
      <div className="login-container">
        <h2>Вход</h2>
        <form onSubmit={handleSubmit}>
          <div className="form">
            <label htmlFor="username"><h3>Логин</h3></label>
            <input
              type="text"
              id="email"
              name="email"
              placeholder="Ваш логин"
              required
            />
          </div>

          <div className="form">
            <label htmlFor="password"><h3>Пароль</h3></label>

            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                placeholder="Ваш пароль"
                required
                className="password-input"
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <button className="button-login" type="submit">Войти</button>
          </div>

          {errorVisible && (
            <p className="error-message">{errorMessage}</p>
          )}
        </form>
      </div>
    )}
  </div>
);
}
