import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// 🔧 Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDqLTl88zO79_mgtFNZjZ-LqjzL9iFFEf0",
  authDomain: "reto-comfachoco.firebaseapp.com",
  projectId: "reto-comfachoco",
  storageBucket: "reto-comfachoco.firebasestorage.app",
  messagingSenderId: "42999613297",
  appId: "1:42999613297:web:d666128689acb3a6f8d8d0",
};

// 🔥 Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

emailjs.init("yIVRJfpb5OadHS9pv");

// 🔐 Verificar si hay usuario logueado
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "/"; // Redirige al login si no hay sesión
  } else {
    console.log("Empleado autenticado:", user.email);
    cargarHistorial(user.email);
  }
});

// 🚪 Cerrar sesión
document.getElementById("logoutBtn").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "/";
});

// 📄 Enviar solicitud
const form = document.getElementById("solicitudForm");
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const tipo = document.getElementById("tipo").value;
  const fechaInicio = document.getElementById("fechaInicio").value;
  const fechaFin = document.getElementById("fechaFin").value;
  const motivo = document.getElementById("motivo").value;

  const user = auth.currentUser;
  if (!user) {
    alert("No hay usuario autenticado");
    return;
  }

  if (!tipo || !fechaInicio || !fechaFin) {
    alert("Por favor completa todos los campos obligatorios");
    return;
  }

  try {
    // 🔍 Buscar el documento del empleado en Firestore por su correo
    const empleadosRef = collection(db, "empleados");
    const q = query(empleadosRef, where("correo", "==", user.email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      alert("No se encontró un empleado con este correo en Firestore.");
      return;
    }

    // 📄 Tomar el documento del empleado
    const empleadoDoc = querySnapshot.docs[0];
    const empleadoRef = doc(db, "empleados", empleadoDoc.id);

    const empleadoData = querySnapshot.docs[0].data();

    // 🧾 Crear la solicitud
    const solicitud = {
      id: Date.now().toString(),
      tipo,
      fechaInicio,
      fechaFin,
      motivo,
      estado: "pendiente",
      fechaSolicitud: new Date().toISOString(),
    };

    // 💾 Agregar la solicitud al array "solicitudes"
    await updateDoc(empleadoRef, {
      solicitudes: arrayUnion(solicitud),
    });

    await emailjs.send("service_bgm9yi5", "template_tge8pdd", {
      empleado_nombre: empleadoData.nombre || user.correo,
      tipo,
      fechaInicio,
      fechaFin,
      motivo,
      correo_supervisor: empleadoData.email_supervisor,
    });

    alert("Solicitud enviada y notificación enviada al supervisor ✅");
    form.reset();
  } catch (error) {
    console.error("Error al enviar la solicitud:", error);
    alert("Error al enviar la solicitud.");
  }
});

async function cargarHistorial(correoEmpleado) {
  const historialUl = document.getElementById("historial");
  historialUl.innerHTML = "<li>Cargando historial...</li>";

  try {
    const empleadosRef = collection(db, "empleados");
    const q = query(empleadosRef, where("correo", "==", correoEmpleado));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      historialUl.innerHTML =
        "<li>No se encontró información del empleado.</li>";
      return;
    }

    const empleadoData = snapshot.docs[0].data();
    const solicitudes = empleadoData.solicitudes || [];

    if (solicitudes.length === 0) {
      historialUl.innerHTML = "<li>No has realizado solicitudes todavía.</li>";
      return;
    }

    // Ordenar por fecha de solicitud (más reciente primero)
    solicitudes.sort(
      (a, b) => new Date(b.fechaSolicitud) - new Date(a.fechaSolicitud)
    );

    // Mostrar historial
    historialUl.innerHTML = "";
    solicitudes.forEach((solicitud) => {
      const estado =
        solicitud.estado === "aprobado"
          ? { icon: "bi bi-check-lg", color: "#4CAF50", texto: "Aprobado" }
          : solicitud.estado === "rechazado"
          ? { icon: "bi bi-x-lg", color: "red", texto: "Rechazado" }
          : { icon: "bi bi-hourglass", color: "orange", texto: "Pendiente" };

      const li = document.createElement("li");
      li.innerHTML = `
        <strong>${solicitud.tipo.toUpperCase()}</strong><br>
        <i class="bi bi-calendar-event" style="padding: 5px; font-size: 1.25rem"></i> ${
          solicitud.fechaInicio
        } → ${solicitud.fechaFin}<br>
        <i class="bi bi-chat-left-text" style="padding: 5px; font-size: 1.25rem"></i> ${
          solicitud.motivo || "Sin motivo"
        }<br>
        
        <div class="estado-icono" title="${estado.texto}">
          <i class="${estado.icon}" style="font-size:1.5rem;"></i>
        </div>

      `;
      historialUl.appendChild(li);
    });
  } catch (error) {
    console.error("Error al cargar el historial:", error);
    historialUl.innerHTML = "<li>Error al cargar el historial.</li>";
  }
}
