
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

// Initialiseer Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 🔧 Elementen
const svg = document.getElementById('drawingArea');
const rectButton = document.getElementById('rectButton');
const circleButton = document.getElementById('circleButton');
const eraserButton = document.getElementById('eraserButton');
const editButton = document.getElementById('editButton');
const moveButton = document.getElementById('moveButton');
const clearButton = document.getElementById('clearButton');
const editPopup = document.getElementById('editPopup');
const colorInput = document.getElementById('colorInput');
const nameInput = document.getElementById('nameInput');
const lockCheckbox = document.getElementById('lockCheckbox');
const showLabelCheckbox = document.getElementById('showLabelCheckbox');
const closePopup = document.getElementById('closePopup');
const namePopup = document.getElementById('namePopup');
const fileNameInput = document.getElementById('fileNameInput');
const confirmSaveButton = document.getElementById('confirmSaveButton');
const cancelSaveButton = document.getElementById('cancelSaveButton');
const svgDropdown = document.getElementById('svgDropdown');

let mode = 'rect';
let selectedElement = null;
let isDrawing = false;
let startX = 0, startY = 0;
let laatstGebruikteBestandsnaam = "";

// ▼ Event listeners
rectButton.onclick = () => mode = 'rect';
circleButton.onclick = () => mode = 'circle';
moveButton.onclick = () => mode = 'move';
eraserButton.onclick = () => {
  if (selectedElement) {
    selectedElement.remove();
    selectedElement = null;
  }
};
clearButton.onclick = () => svg.innerHTML = '';

editButton.onclick = () => {
  if (selectedElement) {
    editPopup.style.display = 'block';
    colorInput.value = selectedElement.getAttribute('fill') || '#000000';
    nameInput.value = selectedElement.getAttribute('data-name') || '';
    lockCheckbox.checked = selectedElement.getAttribute('data-locked') === 'true';
    showLabelCheckbox.checked = selectedElement.getAttribute('data-show-label') === 'true';
  }
};
closePopup.onclick = () => editPopup.style.display = 'none';

// Bewerken van eigenschappen
colorInput.oninput = () => selectedElement.setAttribute('fill', colorInput.value);
nameInput.oninput = () => {
  selectedElement.setAttribute('data-name', nameInput.value);
  updateLabel(selectedElement);
};
lockCheckbox.onchange = () => selectedElement.setAttribute('data-locked', lockCheckbox.checked);
showLabelCheckbox.onchange = () => {
  selectedElement.setAttribute('data-show-label', showLabelCheckbox.checked);
  updateLabel(selectedElement);
};

function updateLabel(el) {
  let label = el.nextElementSibling;
  if (!label || label.tagName !== 'text') {
    label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    el.after(label);
  }
  label.textContent = el.getAttribute('data-show-label') === 'true' ? el.getAttribute('data-name') || '' : '';
  const bbox = el.getBBox();
  label.setAttribute('x', bbox.x + bbox.width + 5);
  label.setAttribute('y', bbox.y + 12);
}

// ▼ Teken functionaliteit
svg.addEventListener('mousedown', e => {
  if (mode === 'move') return;
  if (e.target.closest('svg') !== svg) return;
  isDrawing = true;
  startX = e.offsetX;
  startY = e.offsetY;
});

svg.addEventListener('mouseup', e => {
  if (!isDrawing) return;
  isDrawing = false;
  const x = startX;
  const y = startY;
  const w = e.offsetX - x;
  const h = e.offsetY - y;
  const shape = document.createElementNS("http://www.w3.org/2000/svg", mode === 'circle' ? 'circle' : 'rect');
  if (mode === 'circle') {
    shape.setAttribute('cx', x + w / 2);
    shape.setAttribute('cy', y + h / 2);
    shape.setAttribute('r', Math.sqrt(w * w + h * h) / 2);
  } else {
    shape.setAttribute('x', x);
    shape.setAttribute('y', y);
    shape.setAttribute('width', w);
    shape.setAttribute('height', h);
  }
  shape.setAttribute('fill', '#00aaff');
  shape.setAttribute('stroke', '#333');
  shape.addEventListener('click', () => selectedElement = shape);
  svg.appendChild(shape);
});

// ▼ Opslaan functionaliteit
document.getElementById('saveButton').onclick = () => {
  namePopup.style.display = 'block';
  fileNameInput.value = laatstGebruikteBestandsnaam || '';
};

confirmSaveButton.onclick = async () => {
  const filename = fileNameInput.value.trim();
  if (!filename) return alert("Geen naam ingevoerd.");
  const svgContent = svg.outerHTML;
  await db.collection("svg-files").doc(filename).set({
    filename,
    svg: svgContent,
    timestamp: new Date().toISOString()
  });
  namePopup.style.display = 'none';
  laatstGebruikteBestandsnaam = filename;
  alert("SVG opgeslagen!");
  laadSVGKeuzes();
};

cancelSaveButton.onclick = () => namePopup.style.display = 'none';

// ▼ Nieuwe SVG maken
window.maakNieuweSVG = () => {
  svg.innerHTML = '';
  const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  bg.setAttribute("x", 50);
  bg.setAttribute("y", 50);
  bg.setAttribute("width", 200);
  bg.setAttribute("height", 200);
  bg.setAttribute("fill", "#ddd");
  svg.appendChild(bg);
  laatstGebruikteBestandsnaam = '';
  svgDropdown.value = '';
};

// ▼ Dropdown laden + SVG inladen
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

svgDropdown.addEventListener('change', async () => {
  const filename = svgDropdown.value;
  if (!filename) return;
  const docSnap = await db.collection("svg-files").doc(filename).get();
  if (docSnap.exists) {
    svg.outerHTML = docSnap.data().svg;
    laatstGebruikteBestandsnaam = filename;
  }
});

// Init dropdown bij opstart
laadSVGKeuzes();
