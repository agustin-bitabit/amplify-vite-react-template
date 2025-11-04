import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import type { Schema } from "../../amplify/data/resource";
import { generateClient } from "aws-amplify/data";

const client = generateClient<Schema>({
  authMode: "userPool",
});

export default function TaskList() {
  const [tasks, setTasks] = useState<Array<Schema["Todo"]["type"]>>([]);
  const [taskData, setTaskData] = useState({
    description: "",
    projectName: "",
    points: 0,
    deliveryDate: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  useEffect(() => {
    const sub = client.models.Todo.observeQuery().subscribe({
      next: (data) => setTasks([...data.items]),
    });
    return () => sub.unsubscribe();
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
      setTaskData({
        description: "",
        projectName: "",
        points: 0,
        deliveryDate: "",
      });
      setShowSuccessPopup(true);
      setTimeout(() => setShowSuccessPopup(false), 3000); // Ocultar después de 3 segundos
    } catch (error) {
      console.error("Error creating task:", error);
      alert("Hubo un error al guardar la tarea. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await client.models.Todo.delete({ id });
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  // Filtrar tareas para la semana actual
  const getWeekTasks = (allTasks: Array<Schema["Todo"]["type"]>) => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Domingo, 1 = Lunes, ...
    const diffToMonday = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const startOfWeek = new Date(now.setDate(diffToMonday));
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return allTasks.filter((task) => {
      if (!task.deliveryDate) return false;
      const taskDate = new Date(task.deliveryDate + "T00:00:00");
      return taskDate >= startOfWeek && taskDate <= endOfWeek;
    });
  };

  const weeklyTasks = getWeekTasks(tasks);
  const weeklyPoints = weeklyTasks.reduce(
    (sum, task) => sum + (task.points || 0),
    0
  );

  return (
    <>
      {showSuccessPopup && (
        <div className="success-popup show">
          <span className="checkmark">✔</span> Tarea guardada con éxito
        </div>
      )}

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
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1rem",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <h3>Tareas de la Semana</h3>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <strong>SP de la Semana: {weeklyPoints}</strong>
            <Link to="/semanas" className="btn btn-primary">
              Ver Semanas
            </Link>
          </div>
        </div>

        {weeklyTasks.length === 0 ? (
          <p>Aún no has registrado ninguna tarea para esta semana.</p>
        ) : (
          <ul className="tasks-list">
            {weeklyTasks.map((task) => (
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
    </>
  );
}
