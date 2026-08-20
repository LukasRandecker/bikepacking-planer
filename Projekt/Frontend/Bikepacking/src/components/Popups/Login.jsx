import { useEffect, useState } from "react";

import Modal from "../ui/Modal.jsx";
import { Button, Field, Note } from "../ui/Controls.jsx";
import api, { errorMessage } from "../../lib/api.js";

const MIN_PASSWORD = 8;

/**
 * Ein- und Registrieren.
 *
 * Das Passwort wird hier nur eingetippt und weggeschickt — verglichen wird es
 * auf dem Server gegen einen bcrypt-Hash. Der Client bekommt es nie zu sehen,
 * und die Sitzung kommt als httpOnly-Cookie zurück, das JavaScript nicht lesen
 * kann.
 */
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
    e?.preventDefault();
    setError("");

    if (!username || !pw) {
      setError("Enter both a username and a password.");
      return;
    }
    if (!isLogin && pw.length < MIN_PASSWORD) {
      setError(`Pick a password of at least ${MIN_PASSWORD} characters.`);
      return;
    }

    setBusy(true);
    try {
      const { data } = await api.post(
        isLogin ? "/users/login" : "/users/register",
        { username, pw }
      );
      onLoginSuccess(data);
      onClose();
    } catch (err) {
      setError(
        errorMessage(
          err,
          isLogin ? "The login failed." : "The account could not be created."
        )
      );
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
          hint={isLogin ? undefined : "Letters, digits, dots, dashes and underscores."}
        />

        <Field
          label="Password"
          type="password"
          autoComplete={isLogin ? "current-password" : "new-password"}
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          hint={isLogin ? undefined : `At least ${MIN_PASSWORD} characters.`}
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
