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
  mode = 'edit';
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
  if (!el) return;
  const parent = el.parentNode;
  // Verwijder oude label indien aanwezig
  if (el.nextElementSibling && el.nextElementSibling.tagName === 'text') {
    el.nextElementSibling.remove();
  }
  const show = el.getAttribute('data-show-label') === 'true';
  if (!show) return;
  const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  label.textContent = el.getAttribute('data-name') || '';
  label.setAttribute('text-anchor', 'middle');
  label.setAttribute('dominant-baseline', 'middle');
  let x = 0, y = 0, rotate = '';
  if (el.tagName === 'rect') {
    const xVal = parseFloat(el.getAttribute('x'));
    const yVal = parseFloat(el.getAttribute('y'));
    const w = parseFloat(el.getAttribute('width'));
    const h = parseFloat(el.getAttribute('height'));
    x = xVal + w / 2;
    y = yVal + h / 2;
    if (h > w) rotate = `rotate(-90 ${x} ${y})`;
  } else if (el.tagName === 'circle') {
    x = parseFloat(el.getAttribute('cx'));
    y = parseFloat(el.getAttribute('cy'));
  }
  label.setAttribute('x', x);
  label.setAttribute('y', y);
  if (rotate) label.setAttribute('transform', rotate);
  parent.insertBefore(label, el.nextSibling);
}
  const show = el.getAttribute('data-show-label') === 'true';
  if (!show) {
    label.textContent = '';
    return;
  }
  label.textContent = el.getAttribute('data-name') || '';
  label.setAttribute('text-anchor', 'middle');
  label.setAttribute('dominant-baseline', 'middle');
  let x = 0, y = 0, rotate = '';
  if (el.tagName === 'rect') {
    const rectX = parseFloat(el.getAttribute('x'));
    const rectY = parseFloat(el.getAttribute('y'));
    const width = parseFloat(el.getAttribute('width'));
    const height = parseFloat(el.getAttribute('height'));
    x = rectX + width / 2;
    y = rectY + height / 2;
    if (height > width) {
      rotate = `rotate(-90 ${x} ${y})`;
    }
  } else if (el.tagName === 'circle') {
    x = parseFloat(el.getAttribute('cx'));
    y = parseFloat(el.getAttribute('cy'));
  }
  label.setAttribute('x', x);
  label.setAttribute('y', y);
  label.setAttribute('transform', rotate);
  const show = el.getAttribute('data-show-label') === 'true';
  if (!show) {
    label.textContent = '';
    return;
  }
  label.textContent = el.getAttribute('data-name') || '';
  label.setAttribute('text-anchor', 'middle');
  label.setAttribute('alignment-baseline', 'middle');
  let x = 0, y = 0, rotate = '';
  if (el.tagName === 'rect') {
    const rectX = parseFloat(el.getAttribute('x'));
    const rectY = parseFloat(el.getAttribute('y'));
    const width = parseFloat(el.getAttribute('width'));
    const height = parseFloat(el.getAttribute('height'));
    x = rectX + width / 2;
    y = rectY + height / 2;
    if (height > width) {
      rotate = `rotate(-90 ${x} ${y})`;
    }
  } else if (el.tagName === 'circle') {
    x = parseFloat(el.getAttribute('cx'));
    y = parseFloat(el.getAttribute('cy'));
  }
  label.setAttribute('x', x);
  label.setAttribute('y', y);
  label.setAttribute('transform', rotate);
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
  alert("Havenplan opgeslagen!");
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

// sleepbaar maken van controls
const dragHandle = document.getElementById("dragHandle");
const controls = document.getElementById("controls");

let isDragging = false;
let offset = { x: 0, y: 0 };

dragHandle.addEventListener("mousedown", (e) => {
  isDragging = true;
  offset.x = e.clientX - controls.offsetLeft;
  offset.y = e.clientY - controls.offsetTop;
  dragHandle.style.cursor = "grabbing";
});

document.addEventListener("mousemove", (e) => {
  if (!isDragging) return;
  controls.style.left = `${e.clientX - offset.x}px`;
  controls.style.top = `${e.clientY - offset.y}px`;
});

document.addEventListener("mouseup", () => {
  isDragging = false;
  dragHandle.style.cursor = "grab";
});


// 🖱️ Klik op SVG-elementen bij 'Bewerk'-modus om te openen
svg.addEventListener('click', (e) => {
  if (mode === 'edit') {
    if (e.target.tagName === 'rect' || e.target.tagName === 'circle') {
      selectedElement = e.target;
      editPopup.style.display = 'block';
      colorInput.value = selectedElement.getAttribute('fill') || '#000000';
      nameInput.value = selectedElement.getAttribute('data-name') || '';
      lockCheckbox.checked = selectedElement.getAttribute('data-locked') === 'true';
      showLabelCheckbox.checked = selectedElement.getAttribute('data-show-label') === 'true';

      // Popup positioneren naast muis
      editPopup.style.left = `${e.clientX + 20}px`;
      editPopup.style.top = `${e.clientY}px`;
      voegResizeHandleToe(selectedElement);
    }
  }
});


// 🟡 Voeg resize-handle toe aan geselecteerde vorm
function voegResizeHandleToe(element) {
  // Verwijder bestaande handle als die er is
  const bestaandeHandle = document.getElementById("resize-handle");
  if (bestaandeHandle) bestaandeHandle.remove();

  const handle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  handle.setAttribute("id", "resize-handle");
  handle.setAttribute("r", 6);
  handle.setAttribute("fill", "#ff9800");
  handle.setAttribute("stroke", "#333");
  handle.setAttribute("stroke-width", "1");
  handle.style.cursor = "nwse-resize";

  const bbox = element.getBBox();
  handle.setAttribute("cx", bbox.x + bbox.width);
  handle.setAttribute("cy", bbox.y + bbox.height);

  element.parentNode.appendChild(handle);
}


// 🟢 Interactieve resize-functionaliteit
let isResizing = false;

svg.addEventListener("mousedown", (e) => {
  if (e.target.id === "resize-handle") {
    isResizing = true;
    e.preventDefault();
  }
});

svg.addEventListener("mousemove", (e) => {
  if (!isResizing || !selectedElement) return;

  const pt = svg.createSVGPoint();
  pt.x = e.clientX;
  pt.y = e.clientY;
  const cursorpt = pt.matrixTransform(svg.getScreenCTM().inverse());

  if (selectedElement.tagName === "rect") {
    const x = parseFloat(selectedElement.getAttribute("x"));
    const y = parseFloat(selectedElement.getAttribute("y"));
    selectedElement.setAttribute("width", Math.max(10, cursorpt.x - x));
    selectedElement.setAttribute("height", Math.max(10, cursorpt.y - y));
  } else if (selectedElement.tagName === "circle") {
    const cx = parseFloat(selectedElement.getAttribute("cx"));
    const cy = parseFloat(selectedElement.getAttribute("cy"));
    const dx = cursorpt.x - cx;
    const dy = cursorpt.y - cy;
    const newR = Math.sqrt(dx * dx + dy * dy);
    selectedElement.setAttribute("r", Math.max(5, newR));
  }

  voegResizeHandleToe(selectedElement); // update handle positie
});

svg.addEventListener("mouseup", () => {
  isResizing = false;
});


// 🔧 Sleepbare controls (sidebar)
const dragHandle = document.getElementById("dragHandle");
const controls = document.getElementById("controls");

let isDraggingControls = false;
let dragOffset = { x: 0, y: 0 };

dragHandle.addEventListener("mousedown", (e) => {
  isDraggingControls = true;
  dragOffset.x = e.clientX - controls.offsetLeft;
  dragOffset.y = e.clientY - controls.offsetTop;
  dragHandle.style.cursor = "grabbing";
  e.preventDefault();
});

document.addEventListener("mousemove", (e) => {
  if (isDraggingControls) {
    controls.style.left = `${e.clientX - dragOffset.x}px`;
    controls.style.top = `${e.clientY - dragOffset.y}px`;
  }
});

document.addEventListener("mouseup", () => {
  if (isDraggingControls) {
    isDraggingControls = false;
    dragHandle.style.cursor = "grab";
  }
});
