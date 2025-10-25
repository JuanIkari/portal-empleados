const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const { db } = require("./src/db/connection");
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("src"));

// Página principal
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "/src/views/login.html"));
});

// Login simple (según nombre)
app.post("/login", async (req, res) => {
  const nombre = req.body.nombre;
  const snapshot = await db
    .collection("empleados")
    .where("nombre", "==", nombre)
    .get();
  if (snapshot.empty) return res.send("Usuario no encontrado");

  const user = snapshot.docs[0].data();
  user.id = snapshot.docs[0].id;

  if (user.rol === "empleado") res.redirect(`/empleado?id=${user.id}`);
  else if (user.rol === "supervisor") res.redirect("/supervisor");
  else res.redirect("/rrhh");
});

// Página empleado
app.get("/empleado", (req, res) => {
  res.sendFile(path.join(__dirname, "src/views/empleado.html"));
});

// Crear solicitud
app.post("/solicitar", async (req, res) => {
  const { user_id, tipo, fecha_inicio, fecha_fin, motivo } = req.body;
  const start = new Date(fecha_inicio);
  const end = new Date(fecha_fin);
  const dias = (end - start) / (1000 * 60 * 60 * 24) + 1;

  const userRef = db.collection("users").doc(user_id);
  const userSnap = await userRef.get();
  const saldo = userSnap.data().saldo_vacaciones;

  if (dias > saldo) return res.send("No tienes saldo suficiente.");

  await db.collection("requests").add({
    user_id,
    tipo,
    fecha_inicio,
    fecha_fin,
    dias,
    estado: "pendiente",
    motivo,
  });

  res.send("Solicitud creada con éxito.");
});

// Vista supervisor
app.get("/supervisor", (req, res) => {
  res.sendFile(path.join(__dirname, "src/views/supervisor.html"));
});

// Aprobar/Rechazar
app.post("/aprobar", async (req, res) => {
  const { id, accion } = req.body;
  await db.collection("requests").doc(id).update({ estado: accion });
  res.redirect("/supervisor");
});

// RRHH: ver todas las solicitudes
app.get("/rrhh", (req, res) => {
  res.sendFile(path.join(__dirname, "src/views/rrhh.html"));
});

// API para solicitudes (usada por supervisor y rrhh)
app.get("/api/requests", async (req, res) => {
  const snapshot = await db.collection("requests").get();
  const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  res.json(data);
});

app.patch("/api/requests/:id", async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  await db.collection("requests").doc(id).update({ estado });
  res.json({ mensaje: `Solicitud ${estado}` });
});

app.listen(3000, () =>
  console.log("Servidor corriendo en http://localhost:3000")
);
