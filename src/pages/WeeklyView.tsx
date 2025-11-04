import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import type { Schema } from "../../amplify/data/resource";
import { generateClient } from "aws-amplify/data";

const client = generateClient<Schema>({
  authMode: "userPool",
});

export default function WeeklyView() {
  const [tasks, setTasks] = useState<Array<Schema["Todo"]["type"]>>([]);

  useEffect(() => {
    const sub = client.models.Todo.observeQuery().subscribe({
      next: (data) => setTasks([...data.items]),
    });
    return () => sub.unsubscribe();
  }, []);

  const groupTasksByWeek = (tasks: Array<Schema["Todo"]["type"]>) => {
    const grouped: { [weekStartISO: string]: Array<Schema["Todo"]["type"]> } =
      {};

    tasks.forEach((task) => {
      if (!task.deliveryDate) return;
      const taskDate = new Date(task.deliveryDate + "T00:00:00");
      const dayOfWeek = taskDate.getDay();
      const diffToMonday =
        taskDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const weekStartDate = new Date(taskDate.setDate(diffToMonday));
      weekStartDate.setHours(0, 0, 0, 0);

      const weekKey = weekStartDate.toISOString();

      if (!grouped[weekKey]) {
        grouped[weekKey] = [];
      }
      grouped[weekKey].push(task);
    });

    for (const week in grouped) {
      grouped[week].sort(
        (a, b) =>
          new Date(a.deliveryDate!).getTime() -
          new Date(b.deliveryDate!).getTime()
      );
    }

    return grouped;
  };

  const tasksByWeek = groupTasksByWeek(tasks);
  const totalPoints = tasks.reduce((sum, task) => sum + (task.points || 0), 0);

  return (
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
        <h3>Tareas por Semana</h3>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <strong>Total SP: {totalPoints}</strong>
          <Link to="/" className="btn btn-primary">
            Ver Lista
          </Link>
        </div>
      </div>

      <div>
        {Object.keys(tasksByWeek).length === 0 ? (
          <p>No hay tareas para mostrar en la vista semanal.</p>
        ) : (
          Object.entries(tasksByWeek)
            .sort(
              ([weekA], [weekB]) =>
                new Date(weekA).getTime() - new Date(weekB).getTime()
            )
            .map(([weekISO, weekTasks]) => {
              const weekDate = new Date(weekISO);
              const weekLabel = `Semana del ${weekDate.toLocaleDateString(
                "es-ES",
                {
                  day: "numeric",
                  month: "long",
                }
              )}`;
              return (
                <div key={weekISO} style={{ marginBottom: "2rem" }}>
                  <h4>{weekLabel}</h4>
                  <ul className="tasks-list">
                    {weekTasks.map((task) => (
                      <li key={task.id} className="task-item">
                        <div className="task-details">
                          <p className="description">{task.description}</p>
                          <p className="meta">
                            <strong>Proyecto:</strong> {task.projectName} |{" "}
                            <strong>Puntos:</strong> {task.points} |{" "}
                            <strong>Entregado:</strong> {task.deliveryDate}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })
        )}
      </div>
    </section>
  );
}
