import { useEffect, useState } from "react";
import axios from "axios";

import Modal from "../ui/Modal.jsx";
import { Button, Field, Note } from "../ui/Controls.jsx";

const API = "http://localhost:3030/bikepacking";

const Login_Popup = ({ onClose, onLoginSuccess, loginMessage }) => {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const isLogin = mode === "login";

  useEffect(() => setNotice(loginMessage || ""), [loginMessage]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username || !pw) {
      setError("Enter both a username and a password.");
      return;
    }

    setBusy(true);
    try {
      if (isLogin) {
        const res = await axios.get(`${API}/users/username/${username}`);
        if (res.data.pw !== pw) {
          setError("That password does not match this username.");
          return;
        }
        sessionStorage.setItem("userId", res.data._id);
        onLoginSuccess(res.data);
      } else {
        const res = await axios.post(`${API}/users`, { username, pw });
        sessionStorage.setItem("userId", res.data._id);
        onLoginSuccess(res.data);
      }
      onClose();
    } catch (err) {
      const status = err.response?.status;
      if (status === 404)
        setError(`No account called “${username}”. Register instead?`);
      else if (status === 400)
        setError(`“${username}” is taken. Pick another name, or log in.`);
      else
        setError("The server did not answer. Check that it is running on port 3030.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      onClose={onClose}
      title={isLogin ? "Log in" : "Register"}
      code="Account"
      footer={
        <div className="flex flex-col gap-3">
          <Button
            variant="clay"
            onClick={handleSubmit}
            busy={busy}
            className="w-full"
          >
            {isLogin ? "Log in" : "Create account"}
          </Button>
          <p className="t-label text-center">
            {isLogin ? "No account yet?" : "Already registered?"}{" "}
            <button
              type="button"
              className="t-label t-label--clay underline"
              onClick={() => {
                setMode(isLogin ? "register" : "login");
                setError("");
              }}
            >
              {isLogin ? "Register" : "Log in"}
            </button>
          </p>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {notice && !error ? <Note tone="info">{notice}</Note> : null}
        {error ? <Note tone="error">{error}</Note> : null}

        <Field
          label="Username"
          type="text"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          error={error && !username ? "Required" : undefined}
        />

        <Field
          label="Password"
          type="password"
          autoComplete={isLogin ? "current-password" : "new-password"}
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          error={error && !pw ? "Required" : undefined}
        />

        {/* Lets Enter submit the form; the visible action lives in the footer. */}
        <button type="submit" className="sr-only" tabIndex={-1}>
          {isLogin ? "Log in" : "Create account"}
        </button>
      </form>
    </Modal>
  );
};

export default Login_Popup;
