import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// 🔥 Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDqLTl88zO79_mgtFNZjZ-LqjzL9iFFEf0",
  authDomain: "reto-comfachoco.firebaseapp.com",
  projectId: "reto-comfachoco",
  storageBucket: "reto-comfachoco.firebasestorage.app",
  messagingSenderId: "42999613297",
  appId: "1:42999613297:web:d666128689acb3a6f8d8d0",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ✉️ Inicializar EmailJS
emailjs.init("yIVRJfpb5OadHS9pv");

// 📤 Cerrar sesión
document.getElementById("logoutBtn").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "/";
});

// 🧠 Cargar solicitudes del supervisor actual
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "/";
    return;
  }

  const supervisorEmail = user.email;
  console.log("Supervisor autenticado:", supervisorEmail);
  const solicitudesContainer = document.getElementById("solicitudesContainer");

  try {
    const empleadosRef = collection(db, "empleados");
    const q = query(
      empleadosRef,
      where("email_supervisor", "==", supervisorEmail)
    );
    const empleadosSnapshot = await getDocs(q);

    if (empleadosSnapshot.empty) {
      solicitudesContainer.innerHTML = `<div class="text-center text-muted">No hay empleados asignados a este supervisor.</div>`;
      return;
    }

    empleadosSnapshot.forEach((empleadoDoc) => {
      const empleadoData = empleadoDoc.data();
      const empleadoId = empleadoDoc.id;
      const solicitudes = empleadoData.solicitudes || [];

      solicitudes.forEach((solicitud, index) => {
        const card = document.createElement("div");
        card.className = "col-md-6 col-lg-4";
        card.innerHTML = `
          <div class="card shadow-sm">
            <div class="card-body">
              <h5 class="card-title text-primary">${solicitud.tipo.toUpperCase()}</h5>
              <p><strong>Empleado:</strong> ${
                empleadoData.nombre || "Sin nombre"
              }</p>
              <p><strong>Desde:</strong> ${solicitud.fechaInicio}</p>
              <p><strong>Hasta:</strong> ${solicitud.fechaFin}</p>
              <p><strong>Motivo:</strong> ${
                solicitud.motivo || "Sin motivo"
              }</p>
              <p><strong>Estado:</strong> 
                <span class="badge ${
                  solicitud.estado === "aprobado"
                    ? "bg-success"
                    : solicitud.estado === "rechazado"
                    ? "bg-danger"
                    : "bg-warning text-dark"
                }">${solicitud.estado}</span>
              </p>
              ${
                solicitud.estado === "pendiente"
                  ? `
              <div class="d-flex justify-content-between">
                <button class="btn btn-success btn-sm aprobarBtn">Aprobar</button>
                <button class="btn btn-danger btn-sm rechazarBtn">Rechazar</button>
              </div>
              `
                  : ""
              }
            </div>
          </div>
        `;

        const aprobarBtn = card.querySelector(".aprobarBtn");
        const rechazarBtn = card.querySelector(".rechazarBtn");

        if (aprobarBtn) {
          aprobarBtn.addEventListener("click", () =>
            actualizarEstadoSolicitud(
              empleadoId,
              index,
              "aprobado",
              empleadoData
            )
          );
        }

        if (rechazarBtn) {
          rechazarBtn.addEventListener("click", () =>
            actualizarEstadoSolicitud(
              empleadoId,
              index,
              "rechazado",
              empleadoData
            )
          );
        }

        solicitudesContainer.appendChild(card);
      });
    });
  } catch (error) {
    console.error("Error al cargar las solicitudes:", error);
    solicitudesContainer.innerHTML = `<div class="text-danger text-center">Error al cargar las solicitudes.</div>`;
  }
});

// ✅ Actualizar estado y enviar notificación
async function actualizarEstadoSolicitud(
  empleadoId,
  index,
  nuevoEstado,
  empleadoData
) {
  try {
    const empleadoRef = doc(db, "empleados", empleadoId);
    const empleadoSnap = await getDoc(empleadoRef);

    if (!empleadoSnap.exists()) {
      console.error("Empleado no encontrado.");
      return;
    }

    const solicitudes = empleadoSnap.data().solicitudes || [];
    solicitudes[index].estado = nuevoEstado;

    await updateDoc(empleadoRef, { solicitudes });

    await enviarNotificacionEmail(
      // 📨 Enviar notificación por correo al empleado
      empleadoData.correo,
      empleadoData.nombre,
      solicitudes[index],
      nuevoEstado
    );

    alert(`Solicitud ${nuevoEstado} correctamente.`);
    location.reload();
  } catch (error) {
    console.error("Error al actualizar el estado:", error);
  }
}

async function enviarNotificacionEmail(
  // 📧 Enviar correo con EmailJS
  emailEmpleado,
  nombreEmpleado,
  solicitud,
  estado
) {
  try {
    console.log("Enviando correo a:", emailEmpleado);
    console.log("nombre del empleado", nombreEmpleado);
    console.log("Datos de la solicitud:", solicitud);
    console.log("Estado:", estado);

    const templateParams = {
      to_email: emailEmpleado,
      to_name: nombreEmpleado || "Empleado",
      tipo: solicitud.tipo || "Solicitud",
      fechaInicio: solicitud.fechaInicio,
      fechaFin: solicitud.fechaFin,
      estado: estado.toUpperCase(),
      message:
        estado === "aprobado"
          ? "Tu solicitud ha sido aprobada por tu supervisor. 👍"
          : "Tu solicitud ha sido rechazada por tu supervisor. 🚨",
    };

    await emailjs.send("service_bgm9yi5", "template_tctlr7j", templateParams);
    console.log("Correo enviado a:", emailEmpleado);
  } catch (error) {
    console.error("Error al enviar notificación por correo:", error);
  }
}
