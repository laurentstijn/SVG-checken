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

// Variabelen
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
let resizingElement = null;

// Helper functies
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

function addResizeHandle(shape) {
  const handle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  handle.classList.add('resize-handle');
  handle.setAttribute('r', 6);
  handle.setAttribute('fill', 'red');
  handle.style.display = 'none';

  if (shape.tagName === 'rect') {
    handle.setAttribute('cx', parseFloat(shape.getAttribute('x')) + parseFloat(shape.getAttribute('width')));
    handle.setAttribute('cy', parseFloat(shape.getAttribute('y')) + parseFloat(shape.getAttribute('height')));
  } else if (shape.tagName === 'circle') {
    handle.setAttribute('cx', parseFloat(shape.getAttribute('cx')) + parseFloat(shape.getAttribute('r')));
    handle.setAttribute('cy', parseFloat(shape.getAttribute('cy')));
  }

  svg.appendChild(handle);
  handle.setAttribute('data-shape-id', shape.getAttribute('data-id'));
  return handle;
}

function showHandles() {
  document.querySelectorAll('.resize-handle').forEach(handle => {
    handle.style.display = 'block';
  });
}

function hideHandles() {
  document.querySelectorAll('.resize-handle').forEach(handle => {
    handle.style.display = 'none';
  });
}

// Modus wisselen
rectButton.addEventListener('click', () => { mode = 'rect'; hideHandles(); });
circleButton.addEventListener('click', () => { mode = 'circle'; hideHandles(); });
eraserButton.addEventListener('click', () => { mode = 'erase'; hideHandles(); });
editButton.addEventListener('click', () => { mode = 'edit'; showHandles(); });
moveButton.addEventListener('click', () => { mode = 'move'; showHandles(); });
clearButton.addEventListener('click', () => { clearAll(); hideHandles(); });

// Tekenen
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

  if (e.target.classList.contains('resize-handle')) {
    activeResizeHandle = e.target;
    const shapeId = activeResizeHandle.getAttribute('data-shape-id');
    resizingElement = document.querySelector(`[data-id='${shapeId}']`);
  }

  if (mode === 'move' && (e.target.tagName === 'rect' || e.target.tagName === 'circle')) {
    selectedElement = e.target;
    isDraggingShape = true;
    offsetMoveX = e.offsetX - (parseFloat(selectedElement.getAttribute('x')) || parseFloat(selectedElement.getAttribute('cx')));
    offsetMoveY = e.offsetY - (parseFloat(selectedElement.getAttribute('y')) || parseFloat(selectedElement.getAttribute('cy')));
  }
});

// Klik op vorm: Popup openen of veilig verwijderen
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
      db.collection('shapes').doc(id).delete()
        .then(() => {
          svg.removeChild(e.target);
          const label = document.getElementById(id + '-label');
          if (label) label.remove();
          const handle = document.querySelector(`.resize-handle[data-shape-id='${id}']`);
          if (handle) handle.remove();
          console.log("✅ Vorm succesvol verwijderd uit database én canvas!");
        })
        .catch((error) => {
          console.error("❌ Fout bij verwijderen uit database:", error);
          alert("Verwijderen mislukt. Probeer opnieuw.");
        });
    }
  }
});

// Popup aanpassen
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

// Vorm verplaatsen
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

// Muis loslaten
svg.addEventListener('mouseup', () => {
  activeResizeHandle = null;
  resizingElement = null;
  isDraggingShape = false;
});

// Alles laden bij opstart
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

      addResizeHandle(element);

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
loadShapes(); // 🚀 Automatisch laden

// Alles wissen
function clearAll() {
  if (confirm("Alles wissen?")) {
    db.collection('shapes').get().then(snapshot => {
      const batch = db.batch();
      snapshot.forEach(doc => batch.delete(doc.ref));
      return batch.commit();
    }).then(() => {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      console.log("✅ Alles gewist!");
    });
  }
}

// Menu verplaatsen
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
