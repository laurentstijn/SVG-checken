// 🔥 Firebase configuratie
const firebaseConfig = {
  apiKey: "AIzaSyBrvdXyuMpgkC4lFKjQDeHNihzFRbzMANU",
  authDomain: "tekensvg.firebaseapp.com",
  projectId: "tekensvg"
};

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

// ▼ Knopacties
rectButton.onclick = () => mode = 'rect';
circleButton.onclick = () => mode = 'circle';
moveButton.onclick = () => mode = 'move';
clearButton.onclick = () => svg.innerHTML = '';

eraserButton.onclick = () => {
  if (selectedElement) {
    selectedElement.remove();
    selectedElement = null;
  }
};

editButton.onclick = () => {
  if (!selectedElement) return;
  editPopup.style.display = 'block';
  colorInput.value = selectedElement.getAttribute('fill') || '#000000';
  nameInput.value = selectedElement.getAttribute('data-name') || '';
  lockCheckbox.checked = selectedElement.getAttribute('data-locked') === 'true';
  showLabelCheckbox.checked = selectedElement.getAttribute('data-show-label') === 'true';
};

closePopup.onclick = () => editPopup.style.display = 'none';

// Bewerken
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

// Labels
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

// Teken functionaliteit
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
  shape.setAttribute('data-name', '');
  shape.setAttribute('data-locked', 'false');
  shape.setAttribute('data-show-label', 'false');

  shape.addEventListener('click', () => selectedElement = shape);
  svg.appendChild(shape);
});

// Opslaan naar Firestore als individuele shapes
document.getElementById('saveButton').onclick = () => {
  namePopup.style.display = 'block';
  fileNameInput.value = laatstGebruikteBestandsnaam || '';
};

confirmSaveButton.onclick = async () => {
  const filename = fileNameInput.value.trim();
  if (!filename) return alert("Geen naam ingevoerd.");
  
  const shapes = [];
  svg.querySelectorAll('rect, circle').forEach(el => {
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

  namePopup.style.display = 'none';
  laatstGebruikteBestandsnaam = filename;
  alert("Shapes opgeslagen!");
  laadSVGKeuzes();
};

cancelSaveButton.onclick = () => namePopup.style.display = 'none';

// Laad SVG shapes individueel
svgDropdown.addEventListener('change', async () => {
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
      updateLabel(el);
    });
    laatstGebruikteBestandsnaam = filename;
  }
});

// Nieuwe lege canvas
window.maakNieuweSVG = () => {
  svg.innerHTML = '';
  laatstGebruikteBestandsnaam = '';
  svgDropdown.value = '';
};

// Dropdown vullen
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

laadSVGKeuzes();
