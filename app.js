// 🔥 Firebase configuratie
const firebaseConfig = {
  apiKey: "AIzaSyBrvdXyuMpgkC4lFKjQDeHNihzFRbzMANU",
  authDomain: "tekensvg.firebaseapp.com",
  databaseURL: "https://tekensvg-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "tekensvg",
  storageBucket: "tekensvg.firebasestorage.app",
  messagingSenderId: "180262088073",
  appId: "1:180262088073:web:6470e50e3ad8a587ef8558"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const svg = document.getElementById("drawingArea");
const rectButton = document.getElementById("rectButton");
const circleButton = document.getElementById("circleButton");
const eraserButton = document.getElementById("eraserButton");
const editButton = document.getElementById("editButton");
const moveButton = document.getElementById("moveButton");
const clearButton = document.getElementById("clearButton");
const editPopup = document.getElementById("editPopup");
const colorInput = document.getElementById("colorInput");
const nameInput = document.getElementById("nameInput");
const lockCheckbox = document.getElementById("lockCheckbox");
const showLabelCheckbox = document.getElementById("showLabelCheckbox");
const closePopup = document.getElementById("closePopup");
const fileNameInput = document.getElementById("fileNameInput");
const confirmSaveButton = document.getElementById("confirmSaveButton");
const cancelSaveButton = document.getElementById("cancelSaveButton");
const namePopup = document.getElementById("namePopup");
const svgDropdown = document.getElementById("svgDropdown");

let mode = "rect";
let selectedElement = null;
let isDrawing = false;
let startX = 0, startY = 0;
let laatstGebruikteBestandsnaam = "";

// 🔁 Events
rectButton.onclick = () => mode = "rect";
circleButton.onclick = () => mode = "circle";
moveButton.onclick = () => mode = "move";
clearButton.onclick = () => svg.innerHTML = "";
eraserButton.onclick = () => {
  if (selectedElement) {
    const label = document.getElementById(selectedElement.getAttribute("data-id") + "-label");
    if (label) label.remove();
    selectedElement.remove();
    selectedElement = null;
  }
};

editButton.onclick = () => {
  if (!selectedElement) return;
  editPopup.style.display = "block";
  colorInput.value = selectedElement.getAttribute("fill") || "#000000";
  nameInput.value = selectedElement.getAttribute("data-name") || "";
  lockCheckbox.checked = selectedElement.getAttribute("data-locked") === "true";
  showLabelCheckbox.checked = selectedElement.getAttribute("data-show-label") === "true";
};

closePopup.onclick = () => editPopup.style.display = "none";

colorInput.oninput = () => selectedElement.setAttribute("fill", colorInput.value);
nameInput.oninput = () => {
  selectedElement.setAttribute("data-name", nameInput.value);
  updateOrCreateLabel(selectedElement);
};
lockCheckbox.onchange = () => selectedElement.setAttribute("data-locked", lockCheckbox.checked);
showLabelCheckbox.onchange = () => {
  selectedElement.setAttribute("data-show-label", showLabelCheckbox.checked);
  updateOrCreateLabel(selectedElement);
};

// 🖱️ Tekenen
svg.addEventListener("mousedown", e => {
  if (mode === "move" || e.target !== svg) return;
  isDrawing = true;
  startX = e.offsetX;
  startY = e.offsetY;
});

svg.addEventListener("mouseup", e => {
  if (!isDrawing) return;
  isDrawing = false;

  const shape = document.createElementNS("http://www.w3.org/2000/svg", mode === "circle" ? "circle" : "rect");
  const id = "id" + Date.now();

  if (mode === "circle") {
    const dx = e.offsetX - startX;
    const dy = e.offsetY - startY;
    shape.setAttribute("cx", startX + dx / 2);
    shape.setAttribute("cy", startY + dy / 2);
    shape.setAttribute("r", Math.sqrt(dx * dx + dy * dy) / 2);
  } else {
    shape.setAttribute("x", startX);
    shape.setAttribute("y", startY);
    shape.setAttribute("width", e.offsetX - startX);
    shape.setAttribute("height", e.offsetY - startY);
  }

  shape.setAttribute("fill", "#00aaff");
  shape.setAttribute("stroke", "#333");
  shape.setAttribute("data-id", id);
  shape.setAttribute("data-name", "");
  shape.setAttribute("data-locked", "false");
  shape.setAttribute("data-show-label", "false");

  shape.addEventListener("click", () => selectedElement = shape);
  svg.appendChild(shape);
});

// 🏷️ Labels
function updateOrCreateLabel(el) {
  const id = el.getAttribute("data-id");
  let label = document.getElementById(id + "-label");

  if (!label) {
    label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("id", id + "-label");
    label.setAttribute("font-size", "12");
    label.setAttribute("fill", "black");
    svg.appendChild(label);
  }

  const show = el.getAttribute("data-show-label") === "true";
  const name = el.getAttribute("data-name") || "";

  label.textContent = show ? name : "";
  const bbox = el.getBBox();
  label.setAttribute("x", bbox.x + bbox.width + 5);
  label.setAttribute("y", bbox.y + 12);
}

// 📁 Opslaan (per shape)
document.getElementById("saveButton").onclick = () => {
  namePopup.style.display = "block";
  fileNameInput.value = laatstGebruikteBestandsnaam || "";
};

confirmSaveButton.onclick = async () => {
  const filename = fileNameInput.value.trim();
  if (!filename) return alert("Geen naam ingevoerd.");

  const shapes = [];
  svg.querySelectorAll("rect, circle").forEach(el => {
    const shape = { type: el.tagName };
    for (let attr of el.attributes) {
      shape[attr.name] = attr.value;
    }
    shapes.push(shape);
  });

  await db.collection("svg-files").doc(filename).set({
    filename,
    shapes,
    timestamp: new Date().toISOString()
  });

  namePopup.style.display = "none";
  laatstGebruikteBestandsnaam = filename;
  alert("Opgeslagen!");
  laadSVGKeuzes();
};

cancelSaveButton.onclick = () => namePopup.style.display = "none";

// 🔁 Laden van shapes
svgDropdown.addEventListener("change", async () => {
  const filename = svgDropdown.value;
  if (!filename) return;

  const docSnap = await db.collection("svg-files").doc(filename).get();
  if (docSnap.exists) {
    svg.innerHTML = '';
    const data = docSnap.data();
    data.shapes.forEach(shape => {
      const el = document.createElementNS("http://www.w3.org/2000/svg", shape.type);
      for (let key in shape) {
        if (key !== "type") el.setAttribute(key, shape[key]);
      }
      el.addEventListener("click", () => selectedElement = el);
      svg.appendChild(el);
      updateOrCreateLabel(el);
    });
    laatstGebruikteBestandsnaam = filename;
  }
});

// ➕ Nieuwe SVG
window.maakNieuweSVG = () => {
  svg.innerHTML = "";
  laatstGebruikteBestandsnaam = "";
  svgDropdown.value = "";
};

// 🔽 Laad dropdown
async function laadSVGKeuzes() {
  svgDropdown.innerHTML = '<option value="">-- Kies een SVG --</option>';
  const snapshot = await db.collection("svg-files").get();
  snapshot.forEach(doc => {
    const opt = document.createElement("option");
    opt.value = doc.id;
    opt.textContent = doc.id;
    svgDropdown.appendChild(opt);
  });
}

const controls = document.getElementById("controls");
const dragHandle = document.getElementById("dragHandle");

let isDraggingControls = false;
let offsetControlsX = 0;
let offsetControlsY = 0;

dragHandle.addEventListener("mousedown", (e) => {
  isDraggingControls = true;
  const rect = controls.getBoundingClientRect();
  offsetControlsX = e.clientX - rect.left;
  offsetControlsY = e.clientY - rect.top;
  dragHandle.style.cursor = "grabbing";
});

document.addEventListener("mousemove", (e) => {
  if (!isDraggingControls) return;
  controls.style.left = `${e.clientX - offsetControlsX}px`;
  controls.style.top = `${e.clientY - offsetControlsY}px`;
});

document.addEventListener("mouseup", () => {
  if (isDraggingControls) {
    isDraggingControls = false;
    dragHandle.style.cursor = "grab";
  }
});


laadSVGKeuzes();
