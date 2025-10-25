window.addEventListener("DOMContentLoaded", async () => {
  const tabla = document.getElementById("tabla");

  try {
    const res = await fetch("/api/requests");
    const data = await res.json();

    if (data.length === 0) {
      tabla.innerHTML =
        "<tr><td colspan='4'>No hay solicitudes registradas</td></tr>";
      return;
    }

    data.forEach((r) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${r.tipo}</td>
        <td>${r.fecha_inicio} - ${r.fecha_fin}</td>
        <td>${r.dias}</td>
        <td>${r.estado}</td>
      `;
      tabla.appendChild(row);
    });
  } catch (error) {
    console.error("Error al cargar solicitudes:", error);
    tabla.innerHTML =
      "<tr><td colspan='4'>Error al obtener los datos</td></tr>";
  }
});
