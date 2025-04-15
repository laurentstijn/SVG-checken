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

// Functie om de vormen correct te laden uit de Firestore-database
function loadShapes() {
  db.collection('shapes').get().then(snapshot => {
    snapshot.forEach(doc => {
      const shape = doc.data();
      let element;

      // Maak het juiste SVG-element op basis van het type van de vorm
      if (shape.type === 'rect') {
        element = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        element.setAttribute('x', shape.x);
        element.setAttribute('y', shape.y);
        element.setAttribute('width', shape.width);
        element.setAttribute('height', shape.height);
      } else if (shape.type === 'circle') {
        element = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        element.setAttribute('cx', shape.x);
        element.setAttribute('cy', shape.y);
        element.setAttribute('r', shape.r);
      }

      // Stel de fill, naam en andere gegevens in op basis van de Firestore-database
      element.setAttribute('fill', shape.fill || 'skyblue');
      element.setAttribute('data-id', doc.id);
      element.setAttribute('data-name', shape.name || "");
      element.setAttribute('data-locked', shape.locked ? "true" : "false");
      element.setAttribute('data-show-label', shape.showLabel ? "true" : "false");

      // Voeg de vorm toe aan de SVG
      svg.appendChild(element);

      // Voeg label toe als showLabel is ingeschakeld
      if (shape.showLabel && shape.name) {
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('id', doc.id + '-label');
        label.setAttribute('font-size', '12');
        label.setAttribute('fill', 'black');
        label.textContent = shape.name;
        updateLabelPosition(element, label);
        svg.appendChild(label);
        bringLabelToFront(label);
      }
    });
  }).catch((error) => {
    console.error("Fout bij het laden van vormen uit Firestore: ", error);
  });
}

loadShapes(); // Roep de functie aan om de vormen bij het laden van de pagina op te halen


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

// Functie om de geselecteerde vorm te bewerken
function editShape(element) {
  const shapeId = element.getAttribute('data-id');
  const shapeName = element.getAttribute('data-name');
  const shapeFill = element.getAttribute('fill');
  const shapeLocked = element.getAttribute('data-locked') === "true";
  const shapeShowLabel = element.getAttribute('data-show-label') === "true";

  // Zet de waarde van de naam, kleur en andere eigenschappen in de popup
  nameInput.value = shapeName;
  colorInput.value = shapeFill;
  lockCheckbox.checked = shapeLocked;
  showLabelCheckbox.checked = shapeShowLabel;

  // Open de popup
  editPopup.style.display = 'block';

  // Voeg de ID van de vorm toe aan de popup zodat we deze later kunnen gebruiken
  editPopup.setAttribute('data-id', shapeId);

  // Directe updates van de kleur en naam in de SVG
  colorInput.addEventListener('input', () => {
    element.setAttribute('fill', colorInput.value); // Wijzig kleur van de vorm
    updateShapeInDB(element); // Update de database meteen
  });

  nameInput.addEventListener('input', () => {
    element.setAttribute('data-name', nameInput.value); // Wijzig naam van de vorm
    const label = document.getElementById(`${shapeId}-label`);
    if (label) {
      label.textContent = nameInput.value; // Update label tekst
    }
    updateShapeInDB(element); // Update de database meteen
  });

  showLabelCheckbox.addEventListener('change', () => {
    const showLabel = showLabelCheckbox.checked;
    element.setAttribute('data-show-label', showLabel);

    const label = document.getElementById(`${shapeId}-label`);
    if (label) {
      if (showLabel) {
        label.style.display = 'block'; // Toon het label
        label.textContent = nameInput.value; // Update de label tekst
        updateLabelPosition(element, label); // Zorg ervoor dat het label goed gepositioneerd wordt
        bringLabelToFront(label);
      } else {
        label.style.display = 'none'; // Verberg het label
      }
    }
    updateShapeInDB(element); // Update de database meteen
  });
}

// Event listener voor de 'Edit' knop
editButton.addEventListener('click', () => {
  mode = 'edit'; // Zet de modus naar 'edit'
});

// Event listener voor het klikken op een vorm in de SVG (in edit-modus)
svg.addEventListener('click', (e) => {
  if (mode === 'edit' && (e.target.tagName === 'rect' || e.target.tagName === 'circle')) {
    editShape(e.target); // Open de edit-popup voor de geselecteerde vorm
  }
});

// Event listener voor het opslaan van de wijzigingen in de vorm
closePopup.addEventListener('click', () => {
  const shapeId = editPopup.getAttribute('data-id');
  const shapeElement = document.querySelector(`[data-id="${shapeId}"]`);

  if (shapeElement) {
    // Verkrijg de gewijzigde gegevens uit de popup
    const newName = nameInput.value.trim();
    const newColor = colorInput.value;
    const isLocked = lockCheckbox.checked;
    const showLabel = showLabelCheckbox.checked;

    // Update de SVG met de nieuwe gegevens
    shapeElement.setAttribute('fill', newColor);
    shapeElement.setAttribute('data-name', newName);
    shapeElement.setAttribute('data-locked', isLocked);
    shapeElement.setAttribute('data-show-label', showLabel);

    // Werk de labelpositie als dat nodig is
    const label = document.getElementById(`${shapeId}-label`);
    if (label && showLabel) {
      label.textContent = newName;
      updateLabelPosition(shapeElement, label);
      bringLabelToFront(label);
    } else if (label && !showLabel) {
      label.remove(); // Verwijder het label als showLabel is uitgeschakeld
    }

    // Werk de vorm bij in de Firestore-database
    updateShapeInDB(shapeElement);

    // Sluit de popup
    editPopup.style.display = 'none';
  }
});

// Functie om de geselecteerde vorm in de Firestore-database bij te werken
function updateShapeInDB(shapeElement) {
  const shapeId = shapeElement.getAttribute('data-id');
  const update = {
    fill: shapeElement.getAttribute('fill'),
    name: shapeElement.getAttribute('data-name'),
    locked: shapeElement.getAttribute('data-locked') === "true",
    showLabel: shapeElement.getAttribute('data-show-label') === "true",
    x: shapeElement.getAttribute('x') || shapeElement.getAttribute('cx'),
    y: shapeElement.getAttribute('y') || shapeElement.getAttribute('cy'),
    width: shapeElement.getAttribute('width') || null,
    height: shapeElement.getAttribute('height') || null,
    r: shapeElement.getAttribute('r') || null,
  };

  db.collection('shapes').doc(shapeId).update(update)
    .then(() => {
      console.log(`Vorm ${shapeId} succesvol bijgewerkt in de database.`);
    })
    .catch((error) => {
      console.error("Fout bij bijwerken van de vorm in de database: ", error);
    });
}
