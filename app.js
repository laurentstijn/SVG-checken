// 🔥 Firebase configuratie (vervang door je eigen gegevens)
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

// 🎯 Variabelen
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

let mode = 'rect';
let selectedElement = null;
let isDrawing = false;
let startX = 0, startY = 0, previewElement = null;
let isDraggingShape = false;
let offsetMoveX = 0, offsetMoveY = 0;
let activeResizeHandle = null;

// 🎯 Helper functies
function bringLabelToFront(label) {
  if (label && label.parentNode) {
    label.parentNode.append(label);
  }
}

function updateLabelPosition(shape, label) {
  if (!shape || !label) return;
  if (shape.tagName === 'rect') {
    label.setAttribute('x', parseFloat(shape.getAttribute('x')) + 5);
    label.setAttribute('y', parseFloat(shape.getAttribute('y')) - 5);
  } else {
    label.setAttribute('x', parseFloat(shape.getAttribute('cx')) + 5);
    label.setAttribute('y', parseFloat(shape.getAttribute('cy')) - 10);
  }
}

function updateShapeInDB() {
  if (!selectedElement) return;
  const id = selectedElement.getAttribute('data-id');
  const update = {
    fill: selectedElement.getAttribute('fill'),
    name: selectedElement.getAttribute('data-name'),
    locked: selectedElement.getAttribute('data-locked') === "true",
    showLabel: selectedElement.getAttribute('data-show-label') === "true",
    x: selectedElement.getAttribute('x') || selectedElement.getAttribute('cx'),
    y: selectedElement.getAttribute('y') || selectedElement.getAttribute('cy'),
    width: selectedElement.getAttribute('width') || null,
    height: selectedElement.getAttribute('height') || null,
    r: selectedElement.getAttribute('r') || null,
  };
  db.collection('shapes').doc(id).update(update);
}

// 🔘 Modus wisselen
rectButton.addEventListener('click', () => mode = 'rect');
circleButton.addEventListener('click', () => mode = 'circle');
eraserButton.addEventListener('click', () => mode = 'erase');
editButton.addEventListener('click', () => mode = 'edit');
moveButton.addEventListener('click', () => mode = 'move');
clearButton.addEventListener('click', clearAll);

// 🖌️ Tekenen van vormen
svg.addEventListener('mousedown', (e) => {
  if (mode === 'rect' || mode === 'circle') {
    startX = e.offsetX;
    startY = e.offsetY;
    isDrawing = true;

    if (mode === 'rect') {
      previewElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      previewElement.setAttribute('x', startX);
      previewElement.setAttribute('y', startY);
      previewElement.setAttribute('width', 1);
      previewElement.setAttribute('height', 1);
    } else {
      previewElement = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      previewElement.setAttribute('cx', startX);
      previewElement.setAttribute('cy', startY);
      previewElement.setAttribute('r', 1);
    }

    previewElement.setAttribute('fill', 'skyblue');
    svg.appendChild(previewElement);
  }
});

svg.addEventListener('mousemove', (e) => {
  if (isDrawing && previewElement) {
    const currentX = e.offsetX;
    const currentY = e.offsetY;
    if (mode === 'rect') {
      previewElement.setAttribute('width', Math.abs(currentX - startX));
      previewElement.setAttribute('height', Math.abs(currentY - startY));
      previewElement.setAttribute('x', Math.min(startX, currentX));
      previewElement.setAttribute('y', Math.min(startY, currentY));
    } else {
      const dx = currentX - startX;
      const dy = currentY - startY;
      previewElement.setAttribute('r', Math.sqrt(dx * dx + dy * dy) / 2);
    }
  }
});

svg.addEventListener('mouseup', () => {
  if (isDrawing && previewElement) {
    saveShape(previewElement);
    previewElement = null;
    isDrawing = false;
  }
});

// 💾 Vorm opslaan in database
function saveShape(element) {
  const shape = {
    type: element.tagName,
    fill: element.getAttribute('fill'),
    x: element.getAttribute('x') || element.getAttribute('cx'),
    y: element.getAttribute('y') || element.getAttribute('cy'),
    width: element.getAttribute('width') || null,
    height: element.getAttribute('height') || null,
    r: element.getAttribute('r') || null,
    name: '',
    locked: false,
    showLabel: false,
    createdAt: new Date()
  };
  db.collection('shapes').add(shape).then(docRef => {
    element.setAttribute('data-id', docRef.id);
  });
}

// 🖱️ Klik op bestaande vorm
svg.addEventListener('click', (e) => {
  if (mode === 'edit' && (e.target.tagName === 'rect' || e.target.tagName === 'circle')) {
    selectedElement = e.target;
    editPopup.style.display = 'block';
    colorInput.value = selectedElement.getAttribute('fill');
    nameInput.value = selectedElement.getAttribute('data-name') || "";
    lockCheckbox.checked = selectedElement.getAttribute('data-locked') === "true";
    showLabelCheckbox.checked = selectedElement.getAttribute('data-show-label') === "true";
  }

  if (mode === 'erase' && (e.target.tagName === 'rect' || e.target.tagName === 'circle')) {
    if (confirm("Vorm verwijderen?")) {
      const id = e.target.getAttribute('data-id');
      db.collection('shapes').doc(id).delete();
      svg.removeChild(e.target);
      const label = document.getElementById(id + '-label');
      if (label) label.remove();
    }
  }
});

// 🎨 Popup aanpassen
colorInput.addEventListener('input', () => {
  if (selectedElement) {
    selectedElement.setAttribute('fill', colorInput.value);
    updateShapeInDB();
  }
});

nameInput.addEventListener('input', () => {
  if (selectedElement) {
    selectedElement.setAttribute('data-name', nameInput.value);
    const labelId = selectedElement.getAttribute('data-id') + '-label';
    let label = document.getElementById(labelId);
    if (!label) {
      label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('id', labelId);
      label.setAttribute('font-size', '12');
      label.setAttribute('fill', 'black');
      svg.append(label);
    }
    label.textContent = nameInput.value;
    updateLabelPosition(selectedElement, label);
    bringLabelToFront(label);
    updateShapeInDB();
  }
});

lockCheckbox.addEventListener('change', () => {
  if (selectedElement) {
    selectedElement.setAttribute('data-locked', lockCheckbox.checked);
    updateShapeInDB();
  }
});

showLabelCheckbox.addEventListener('change', () => {
  if (selectedElement) {
    const labelId = selectedElement.getAttribute('data-id') + '-label';
    let label = document.getElementById(labelId);

    if (showLabelCheckbox.checked) {
      selectedElement.setAttribute('data-show-label', "true");
      if (!label) {
        label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('id', labelId);
        label.setAttribute('font-size', '12');
        label.setAttribute('fill', 'black');
        svg.append(label);
      }
      label.textContent = selectedElement.getAttribute('data-name');
      updateLabelPosition(selectedElement, label);
      bringLabelToFront(label);
    } else {
      selectedElement.setAttribute('data-show-label', "false");
      if (label) label.remove();
    }
    updateShapeInDB();
  }
});

closePopup.addEventListener('click', () => {
  editPopup.style.display = 'none';
});

// 🖱️ Verplaatsen en vergroten
svg.addEventListener('mousedown', (e) => {
  if (mode === 'move' && (e.target.tagName === 'rect' || e.target.tagName === 'circle')) {
    selectedElement = e.target;
    isDraggingShape = true;
    offsetMoveX = e.offsetX - (parseFloat(selectedElement.getAttribute('x')) || parseFloat(selectedElement.getAttribute('cx')));
    offsetMoveY = e.offsetY - (parseFloat(selectedElement.getAttribute('y')) || parseFloat(selectedElement.getAttribute('cy')));
  }
});

svg.addEventListener('mousemove', (e) => {
  if (isDraggingShape && selectedElement) {
    if (selectedElement.tagName === 'rect') {
      selectedElement.setAttribute('x', e.offsetX - offsetMoveX);
      selectedElement.setAttribute('y', e.offsetY - offsetMoveY);
    } else {
      selectedElement.setAttribute('cx', e.offsetX - offsetMoveX);
      selectedElement.setAttribute('cy', e.offsetY - offsetMoveY);
    }

    const labelId = selectedElement.getAttribute('data-id') + '-label';
    const label = document.getElementById(labelId);
    if (label) {
      updateLabelPosition(selectedElement, label);
      bringLabelToFront(label);
    }
    updateShapeInDB();
  }
});

svg.addEventListener('mouseup', () => {
  isDraggingShape = false;
});

// 🔄 Alles laden
function loadShapes() {
  db.collection('shapes').get().then(snapshot => {
    snapshot.forEach(doc => {
      const shape = doc.data();
      let element;

      if (shape.type === 'rect') {
        element = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        element.setAttribute('x', shape.x);
        element.setAttribute('y', shape.y);
        element.setAttribute('width', shape.width);
        element.setAttribute('height', shape.height);
      } else {
        element = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        element.setAttribute('cx', shape.x);
        element.setAttribute('cy', shape.y);
        element.setAttribute('r', shape.r);
      }

      element.setAttribute('fill', shape.fill || 'skyblue');
      element.setAttribute('data-id', doc.id);
      element.setAttribute('data-name', shape.name || "");
      element.setAttribute('data-locked', shape.locked ? "true" : "false");
      element.setAttribute('data-show-label', shape.showLabel ? "true" : "false");
      svg.appendChild(element);

      if (shape.showLabel && shape.name) {
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('id', doc.id + '-label');
        label.setAttribute('font-size', '12');
        label.setAttribute('fill', 'black');
        label.textContent = shape.name;
        updateLabelPosition(element, label);
        svg.append(label);
        bringLabelToFront(label);
      }
    });
  });
}
loadShapes();

// 🧼 Alles wissen
function clearAll() {
  if (confirm("Alles wissen?")) {
    db.collection('shapes').get().then(snapshot => {
      const batch = db.batch();
      snapshot.forEach(doc => batch.delete(doc.ref));
      return batch.commit();
    }).then(() => {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
    });
  }
}

// 🖱️ Menu verplaatsen
const controls = document.getElementById('controls');
const dragHandle = document.getElementById('dragHandle');

let isDraggingMenu = false;
let menuOffsetX = 0;
let menuOffsetY = 0;

dragHandle.addEventListener('mousedown', (e) => {
  isDraggingMenu = true;
  menuOffsetX = e.clientX - controls.offsetLeft;
  menuOffsetY = e.clientY - controls.offsetTop;
});

document.addEventListener('mousemove', (e) => {
  if (isDraggingMenu) {
    controls.style.left = (e.clientX - menuOffsetX) + 'px';
    controls.style.top = (e.clientY - menuOffsetY) + 'px';
  }
});

document.addEventListener('mouseup', () => {
  isDraggingMenu = false;
});
