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

// Firebase initialiseren
const app = firebase.initializeApp(firebaseConfig); // Initialiseer Firebase-app
const db = firebase.firestore(); // Firestore
const storage = firebase.storage(); // Firebase Storage

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

// 🎯 Helper functies

// Functie om de labelpositie van een vorm bij te werken
function updateLabelPosition(shape, label) {
  if (!shape || !label) return;

  // Bijwerken van de positie van een label op een rechthoekige vorm
  if (shape.tagName === 'rect') {
    label.setAttribute('x', parseFloat(shape.getAttribute('x')) + 5);
    label.setAttribute('y', parseFloat(shape.getAttribute('y')) - 5);
  } else if (shape.tagName === 'circle') { // Bijwerken van de positie van een label op een cirkelvorm
    label.setAttribute('x', parseFloat(shape.getAttribute('cx')) + 12);
    label.setAttribute('y', parseFloat(shape.getAttribute('cy')) - 12);
  }
}

// Functie om de label voor een vorm naar voren te brengen in de weergave
function bringLabelToFront(label) {
  if (label && label.parentNode) {
    label.parentNode.append(label);
  }
}

// Functie om de popup te tonen voor het opslaan van de SVG
function showSavePopup() {
    document.getElementById('namePopup').style.display = 'block'; // Maak de pop-up zichtbaar
}

// Functie om de SVG op te slaan naar Firebase Storage met een opgegeven naam
function saveSVG() {
    const svgElement = document.getElementById('drawingArea');
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);
    const blob = new Blob([svgString], { type: "image/svg+xml" });

    const fileName = document.getElementById('fileNameInput').value.trim();
    
    if (!fileName) {
        alert("Geef een naam op voor het bestand.");
        return;
    }

    const storageRef = storage.ref(`svg_files/${fileName}.svg`);

    // Uploaden van de SVG naar Firebase Storage
    storageRef.put(blob).then((snapshot) => {
        console.log(`SVG succesvol opgeslagen als ${fileName}.svg:`, snapshot);

        // Haal de URL van de opgeslagen SVG op
        storageRef.getDownloadURL().then((url) => {
            db.collection('shapes').add({
                fileName: fileName,
                url: url,
                createdAt: new Date()
            });
        });

        // Sluit de pop-up na succesvolle upload
        document.getElementById('namePopup').style.display = 'none';
    }).catch((error) => {
        console.error('Fout bij opslaan SVG:', error);
        alert("Er is een fout opgetreden bij het opslaan van het bestand.");
    });
}

// Functie om de popup te verbergen (annuleren)
function cancelSave() {
    document.getElementById('namePopup').style.display = 'none'; // Verberg de pop-up zonder op te slaan
}

// Event listeners voor de knoppen
document.getElementById('saveButton').addEventListener('click', showSavePopup); // Wanneer de 'Save' knop wordt geklikt
document.getElementById('confirmSaveButton').addEventListener('click', saveSVG); // Wanneer de gebruiker op 'Confirm' klikt in de pop-up
document.getElementById('cancelSaveButton').addEventListener('click', cancelSave); // Wanneer de gebruiker op 'Cancel' klikt in de pop-up

// Modus wisselen
rectButton.addEventListener('click', () => mode = 'rect');
circleButton.addEventListener('click', () => mode = 'circle');
eraserButton.addEventListener('click', () => mode = 'erase');
editButton.addEventListener('click', () => mode = 'edit');
moveButton.addEventListener('click', () => mode = 'move');
clearButton.addEventListener('click', clearAll);

// Tekenen van vormen
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

// Vorm opslaan in database
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

// Vormen verplaatsen
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
    updateShapeInDB();
  }
});

svg.addEventListener('mouseup', () => {
  isDraggingShape = false;
});

// Functie om de vorm in de database bij te werken
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

// Laad vormen uit de database
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

// Functie om alles te wissen
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
//vanaf hier
// Slepen van het menu inschakelen
const dragHandle = document.getElementById('dragHandle');
const controls = document.getElementById('controls');

let isDragging = false;
let offsetX, offsetY;

dragHandle.addEventListener('mousedown', (e) => {
  // Sla de offset op tussen de muispositie en het menu
  isDragging = true;
  offsetX = e.clientX - controls.getBoundingClientRect().left;
  offsetY = e.clientY - controls.getBoundingClientRect().top;
  dragHandle.style.cursor = 'grabbing';  // Verander cursor tijdens het slepen
});

document.addEventListener('mousemove', (e) => {
  if (isDragging) {
    // Verplaats het menu terwijl de muis wordt bewogen
    controls.style.left = (e.clientX - offsetX) + 'px';
    controls.style.top = (e.clientY - offsetY) + 'px';
  }
});

document.addEventListener('mouseup', () => {
  isDragging = false;
  dragHandle.style.cursor = 'grab';  // Reset cursor na het slepen
});

