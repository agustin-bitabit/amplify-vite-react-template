import { useEffect, useState } from "react";
import { useAuthenticator } from "@aws-amplify/ui-react";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";

const client = generateClient<Schema>({
  authMode: "userPool",
});

function App() {
  const { signOut, user } = useAuthenticator((context) => [context.user]);

  const [tasks, setTasks] = useState<Array<Schema["Todo"]["type"]>>([]);

  const [taskData, setTaskData] = useState({
    description: "",
    projectName: "",
    points: 0,
    deliveryDate: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    client.models.Todo.observeQuery().subscribe({
      next: (data) => setTasks([...data.items]),
    });
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setTaskData((prev) => ({
      ...prev,
      [name]: name === "points" ? parseInt(value, 10) || 0 : value,
    }));
  };

  // Función para crear tareas usando el cliente real de Amplify
  const createTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (
      !taskData.description ||
      !taskData.projectName ||
      taskData.points <= 0 ||
      !taskData.deliveryDate
    ) {
      alert("Por favor, completa todos los campos.");
      return;
    }

    setIsLoading(true);
    try {
      await client.models.Todo.create({
        description: taskData.description,
        projectName: taskData.projectName,
        points: taskData.points,
        deliveryDate: taskData.deliveryDate,
      });
      // Limpiamos el formulario. La lista se actualiza sola gracias a observeQuery.
      setTaskData({
        description: "",
        projectName: "",
        points: 0,
        deliveryDate: "",
      });
    } catch (error) {
      console.error("Error creating task:", error);
      alert("Hubo un error al guardar la tarea. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  // Función para borrar tareas usando el cliente real de Amplify
  const deleteTask = async (id: string) => {
    try {
      await client.models.Todo.delete({ id });
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  return (
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

      <section className="card">
        <h3>Agregar Nueva Tarea</h3>
        <form onSubmit={createTask} className="task-form">
          <div className="form-group full-width">
            <label htmlFor="description">Descripción de la Tarea</label>
            <textarea
              id="description"
              name="description"
              value={taskData.description}
              onChange={handleInputChange}
              required
              className="form-textarea"
            />
          </div>
          <div className="form-group">
            <label htmlFor="projectName">Proyecto</label>
            <input
              id="projectName"
              name="projectName"
              type="text"
              value={taskData.projectName}
              onChange={handleInputChange}
              required
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="points">Story Points</label>
            <input
              id="points"
              name="points"
              type="number"
              min="1"
              value={taskData.points === 0 ? "" : taskData.points}
              onChange={handleInputChange}
              required
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="deliveryDate">Fecha de Entrega</label>
            <input
              id="deliveryDate"
              name="deliveryDate"
              type="date"
              value={taskData.deliveryDate}
              onChange={handleInputChange}
              required
              className="form-input"
            />
          </div>
          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? "Guardando..." : "Guardar Tarea"}
            </button>
          </div>
        </form>
      </section>

      <section className="card">
        <h3>Mis Tareas Registradas</h3>
        {tasks.length === 0 ? (
          <p>Aún no has registrado ninguna tarea esta semana.</p>
        ) : (
          <ul className="tasks-list">
            {tasks.map((task) => (
              <li key={task.id} className="task-item">
                <div className="task-details">
                  <p className="description">{task.description}</p>
                  <p className="meta">
                    <strong>Proyecto:</strong> {task.projectName} |{" "}
                    <strong>Puntos:</strong> {task.points} |{" "}
                    <strong>Entregado:</strong> {task.deliveryDate}
                  </p>
                </div>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="btn btn-destructive"
                >
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

export default App;
