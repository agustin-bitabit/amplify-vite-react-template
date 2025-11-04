import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useAuthenticator } from "@aws-amplify/ui-react";
import TaskList from "./pages/TaskList";
import WeeklyView from "./pages/WeeklyView";

function App() {
  const { signOut, user } = useAuthenticator((context) => [context.user]);

  return (
    <Router>
      <main className="app-main">
        <header className="app-header">
          <h1>Registro de Story Points</h1>
          <div className="user-info">
            <p>Hola, {user?.signInDetails?.loginId}</p>
            <button onClick={signOut} className="btn btn-primary">
              Cerrar Sesión
            </button>
          </div>
        </header>
        <Routes>
          <Route path="/" element={<TaskList />} />
          <Route path="/semanas" element={<WeeklyView />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
