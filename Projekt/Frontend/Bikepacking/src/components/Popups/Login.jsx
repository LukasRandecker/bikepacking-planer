import { useState, useEffect } from "react"; // useEffect hinzufügen
import axios from "axios";

const Login_Popup = ({ onClose, onLoginSuccess, loginMessage }) => {
  // loginMessage als Prop
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (loginMessage) setError(loginMessage); // Meldung vom Parent anzeigen
  }, [loginMessage]);

  const handleSubmit = async () => {
    setError("");
    if (!username || !pw) {
      setError("Please enter your username and password");
      return;
    }

    try {
      if (mode === "login") {
        const res = await axios.get(
          `http://localhost:3030/bikepacking/users/username/${username}`
        );
        if (res.data.pw !== pw) {
          setError("Incorrect password");
          return;
        }

        // Erst User setzen, dann Popup schließen
        onLoginSuccess(res.data);
        sessionStorage.setItem("userId", res.data._id);
        setError("");
        setTimeout(() => onClose(), 0); 
      }

      if (mode === "register") {
        const res = await axios.post(
          "http://localhost:3030/bikepacking/users",
          { username, pw }
        );
        onLoginSuccess(res.data);
        sessionStorage.setItem("userId", res.data._id);
        setError("");
        setTimeout(() => onClose(), 0);
      }
    } catch (err) {
      console.error(err);
      if (err.response?.status === 404) setError("User not found");
      else if (err.response?.status === 400) setError("User already exists");
      else setError("Server error");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white w-79 md:w-99 rounded-xl p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-xl">
          {" "}
          ✕
        </button>

        <h2 className="text-2xl font-semibold mb-4 text-center">
          {mode === "login" ? "Login" : "Register"}
        </h2>

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 mb-3"
        />

        <input
          type="password"
          placeholder="Password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 mb-3"
        />

        {error && (
          <div className="text-red-600 text-sm mb-3 text-center">{error}</div>
        )}

        <button
          onClick={handleSubmit}
          className="w-full bg-black text-white py-2 rounded-lg uppercase mb-3"
        >
          {mode === "login" ? "Login" : "Register"}
        </button>

        <div className="text-center text-sm">
          {mode === "login" ? (
            <span>
              Don't have an account yet?{" "}
              <button className="underline" onClick={() => setMode("register")}>
                Register
              </button>
            </span>
          ) : (
            <span>
              Already registered?{" "}
              <button className="underline" onClick={() => setMode("login")}>
                Login
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login_Popup;
