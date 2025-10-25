import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
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

// 🚀 Inicializamos Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 🧾 Escuchar el formulario de login
const form = document.getElementById("loginForm");
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    // 🔐 Autenticar con Firebase Auth
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;
    console.log("Inicio de sesión exitoso:", user.email);

    // 🔎 Buscar el rol del usuario en Firestore
    const q = query(
      collection(db, "empleados"),
      where("correo", "==", user.email)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      mostrarAlerta("No se encontró información del usuario en la base de datos.", "warning");
      return;
    }

    const userData = querySnapshot.docs[0].data();
    console.log("Rol del usuario:", userData.rol);

    // 🚪 Redirigir según el rol
    if (userData.rol === "empleado") {
      window.location.href = "/empleado";
    } else if (userData.rol === "supervisor") {
      window.location.href = "/supervisor";
    } else if (userData.rol === "rrhh") {
      window.location.href = "/rrhh";
    } else {
      mostrarAlerta("Rol desconocido, contacta al administrador", "warning");
    }
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    mostrarAlerta("Correo o contraseña incorrectos", "error");
  }
});

function mostrarAlerta(mensaje, tipo = "error") {
  const alerta = document.getElementById("customAlert");
  alerta.textContent = mensaje;
  alerta.className = `alert ${tipo}`; // reset clases base
  alerta.classList.add("mostrar"); // mostrar sin “brincar”

  // Ocultar después de 3 segundos
  setTimeout(() => {
    alerta.classList.remove("mostrar");
  }, 3000);
}
