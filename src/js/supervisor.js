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

// 🚪 Cerrar sesión
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
  const solicitudesContainer = document.getElementById("solicitudesContainer");

  try {
    const empleadosRef = collection(db, "empleados");
    const q = query(empleadosRef, where("email_supervisor", "==", supervisorEmail));
    const empleadosSnapshot = await getDocs(q);

    if (empleadosSnapshot.empty) {
      solicitudesContainer.innerHTML = `<p class="mensaje-vacio">No hay empleados asignados a este supervisor.</p>`;
      return;
    }

    empleadosSnapshot.forEach((empleadoDoc) => {
      const empleadoData = empleadoDoc.data();
      const empleadoId = empleadoDoc.id;
      const solicitudes = empleadoData.solicitudes || [];

      solicitudes.forEach((solicitud, index) => {
        const card = document.createElement("div");
        card.className = "solicitud-card";
        card.innerHTML = `
          <div class="solicitud-header">
            <div class="solicitud-titulo">
              <i class="bi bi-person-circle"></i> ${solicitud.tipo.toUpperCase()}
          </div>
            <i class="bi bi-trash3 trash-icon" title="Eliminar solicitud"></i>
          </div>
          <p><i class="bi bi-person-fill"></i> <strong>Empleado:</strong> ${empleadoData.nombre || "Sin nombre"}</p>
          <p><i class="bi bi-calendar-event"></i> <strong>Desde:</strong> ${solicitud.fechaInicio}</p>
          <p><i class="bi bi-calendar-event"></i> <strong>Hasta:</strong> ${solicitud.fechaFin}</p>
          <p><i class="bi bi-pencil-square"></i> <strong>Motivo:</strong> ${solicitud.motivo || "Sin motivo"}</p>
          <p class="estado-texto">
            <i class="bi ${solicitud.estado === "aprobado"
            ? "bi bi-check-lg"
            : solicitud.estado === "rechazado"
              ? "bi bi-x-lg"
              : "bi bi-hourglass"
          }"></i>
          </p>

          ${solicitud.estado === "pendiente"
            ? `
            <div class="botones-accion">
              <button class="btn-aprobar"><i class="bi bi-check-lg"></i> Aprobar</button>
              <button class="btn-rechazar"><i class="bi bi-x-lg"></i> Rechazar</button>
            </div>`
            : ""
          }
        `;

        const aprobarBtn = card.querySelector(".btn-aprobar");
        const rechazarBtn = card.querySelector(".btn-rechazar");

        if (aprobarBtn) {
          aprobarBtn.addEventListener("click", () =>
            actualizarEstadoSolicitud(empleadoId, index, "aprobado", empleadoData)
          );
        }

        if (rechazarBtn) {
          rechazarBtn.addEventListener("click", () =>
            actualizarEstadoSolicitud(empleadoId, index, "rechazado", empleadoData)
          );
        }

        solicitudesContainer.appendChild(card);
      });
    });
  } catch (error) {
    console.error("Error al cargar las solicitudes:", error);
    solicitudesContainer.innerHTML = `<p class="mensaje-error">Error al cargar las solicitudes.</p>`;
  }
});

// ✅ Actualizar estado y enviar notificación
async function actualizarEstadoSolicitud(empleadoId, index, nuevoEstado, empleadoData) {
  try {
    const empleadoRef = doc(db, "empleados", empleadoId);
    const empleadoSnap = await getDoc(empleadoRef);

    if (!empleadoSnap.exists()) return;

    const solicitudes = empleadoSnap.data().solicitudes || [];
    solicitudes[index].estado = nuevoEstado;

    await updateDoc(empleadoRef, { solicitudes });

    await enviarNotificacionEmail(
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

async function enviarNotificacionEmail(emailEmpleado, nombreEmpleado, solicitud, estado) {
  try {
    const templateParams = {
      to_email: emailEmpleado,
      to_name: nombreEmpleado || "Empleado",
      tipo: solicitud.tipo || "Solicitud",
      fechaInicio: solicitud.fechaInicio,
      fechaFin: solicitud.fechaFin,
      estado: estado.toUpperCase(),
      message:
        estado === "aprobado"
          ? "tu solicitud ha sido aprobada por tu supervisor. 👍"
          : "tu solicitud ha sido rechazada por tu supervisor. 🚨",
    };

    await emailjs.send("service_bgm9yi5", "template_tctlr7j", templateParams);
  } catch (error) {
    console.error("Error al enviar notificación por correo:", error);
  }
}
