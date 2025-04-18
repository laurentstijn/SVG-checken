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

// Laad vormen uit de database
function loadShapes() {
  db.collection('shapes').get().then(snapshot => {
    snapshot.forEach(doc => {
      const shape = doc.data();
      let element;

      // Controleer of de vorm een rechthoek of een cirkel is
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

      // Zet de eigenschappen van de vorm, zoals kleur
      element.setAttribute('fill', shape.fill || 'skyblue');
      element.setAttribute('data-id', doc.id);
      element.setAttribute('data-name', shape.name || "");
      element.setAttribute('data-locked', shape.locked ? "true" : "false");
      element.setAttribute('data-show-label', shape.showLabel ? "true" : "false");

      // Voeg de vorm toe aan de SVG
      svg.appendChild(element);

      // Voeg het label toe als de vorm een naam heeft en als het label zichtbaar is
      if (shape.showLabel && shape.name) {
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('id', doc.id + '-label');
        label.setAttribute('font-size', '12');
        label.setAttribute('fill', 'black');
        label.textContent = shape.name;
        updateLabelPosition(element, label); // Zet de juiste positie van het label
        svg.appendChild(label);
        bringLabelToFront(label); // Breng het label naar voren
      }
    });
  }).catch(error => {
    console.error("Er is een fout opgetreden bij het laden van de vormen:", error);
  });
}

// Zorg ervoor dat de vormen geladen worden zodra de pagina is geladen
window.addEventListener('load', loadShapes);

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

// Event listener voor de 'Save' knop
document.getElementById('saveButton').addEventListener('click', showSavePopup); // Wanneer de 'Save' knop wordt geklikt

// Functie om de SVG op te slaan naar Firebase Storage met een opgegeven naam
function saveSVG() {
    const svgElement = document.getElementById('drawingArea'); // Pak het SVG-element
    const serializer = new XMLSerializer(); // Maakt een XML-structuur van de SVG
    const svgString = serializer.serializeToString(svgElement); // Zet de SVG om naar een string
    const blob = new Blob([svgString], { type: "image/svg+xml" }); // Zet de string om naar een blob (bestandsobject)

    // Vraag de gebruiker om een naam voor het bestand in te voeren
    const fileName = document.getElementById('fileNameInput').value.trim();
    
    if (!fileName) {
        alert("Geef een naam op voor het bestand.");
        return;
    }

    // Firebase Storage referentie

    // Upload het bestand naar Firebase Storage
        console.log(`SVG succesvol opgeslagen als ${fileName}.svg:`, snapshot);

        // Haal de download-URL van het opgeslagen bestand op
            console.log('Bestand opgeslagen op Firebase: ', url);

            // Je kunt de URL opslaan in de Firestore-database of ergens anders gebruiken
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

// Event listener voor de 'Save' knop
document.getElementById('saveButton').addEventListener('click', showSavePopup); // Wanneer de 'Save' knop wordt geklikt

// Functie om de popup te tonen voor het opslaan van de SVG
function showSavePopup() {
    document.getElementById('namePopup').style.display = 'block'; // Maak de pop-up zichtbaar
}

// Event listener voor de 'Confirm' knop in de pop-up
document.getElementById('confirmSaveButton').addEventListener('click', saveSVG); // Wanneer de gebruiker op 'Confirm' klikt in de pop-up

// Event listener voor de 'Cancel' knop in de pop-up
document.getElementById('cancelSaveButton').addEventListener('click', cancelSave); // Wanneer de gebruiker op 'Cancel' klikt in de pop-up

// Functie om de popup te verbergen zonder iets op te slaan
function cancelSave() {
    document.getElementById('namePopup').style.display = 'none'; // Verberg de pop-up zonder op te slaan
}


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

// Vormen verplaatsen (inclusief label)
svg.addEventListener('mousemove', (e) => {
  if (isDraggingShape && selectedElement) {
    if (selectedElement.tagName === 'rect') {
      selectedElement.setAttribute('x', e.offsetX - offsetMoveX);
      selectedElement.setAttribute('y', e.offsetY - offsetMoveY);
    } else {
      selectedElement.setAttribute('cx', e.offsetX - offsetMoveX);
      selectedElement.setAttribute('cy', e.offsetY - offsetMoveY);
    }

    // Update de positie van het label
    const label = document.getElementById(`${selectedElement.getAttribute('data-id')}-label`);
    if (label) {
      updateLabelPosition(selectedElement, label);  // Update labelpositie bij verplaatsen
    }

    // Werk de vorm bij in de database met de nieuwe positie
    updateShapeInDB(selectedElement);
  }
});

svg.addEventListener('mouseup', () => {
  isDraggingShape = false;
});

// Functie om de geselecteerde vorm in de database bij te werken
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

// Functie om een vorm te verwijderen
function deleteShape(element) {
  const id = element.getAttribute('data-id');
  
  // Verwijder de vorm uit de Firestore-database
  db.collection('shapes').doc(id).delete().then(() => {
    console.log(`Vorm ${id} succesvol verwijderd uit de database.`);
  }).catch((error) => {
    console.error("Fout bij verwijderen van vorm uit de database: ", error);
  });

  // Verwijder de vorm uit de SVG
  svg.removeChild(element);
}

// Event listener voor gum knop
eraserButton.addEventListener('click', () => {
  mode = 'erase'; // Zet de modus naar 'erase'
});

// Voeg de logica toe voor het verwijderen van de vorm als de gum-modus actief is
svg.addEventListener('click', (e) => {
  if (mode === 'erase' && (e.target.tagName === 'rect' || e.target.tagName === 'circle')) {
    deleteShape(e.target);
  }
});

// Functie om de geselecteerde vorm te bewerken
function editShape(element) {
  // Vul de popup met de huidige gegevens van de vorm
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

// Event listener voor de kleurinput
colorInput.addEventListener('input', () => {
  const shapeId = editPopup.getAttribute('data-id');
  const shapeElement = document.querySelector(`[data-id="${shapeId}"]`);
  const newColor = colorInput.value;

  if (shapeElement) {
    // Verander de kleur van de geselecteerde vorm
    shapeElement.setAttribute('fill', newColor);
    
    // Werk de vorm bij in de Firestore-database
    updateShapeInDB(shapeElement);
  }
});

// Event listener voor de naaminput
nameInput.addEventListener('input', () => {
  const shapeId = editPopup.getAttribute('data-id');
  const shapeElement = document.querySelector(`[data-id="${shapeId}"]`);
  const newName = nameInput.value.trim();

  if (shapeElement) {
    // Verander de naam van de geselecteerde vorm
    shapeElement.setAttribute('data-name', newName);

    // Werk het label bij, indien van toepassing
    const label = document.getElementById(`${shapeId}-label`);
    if (label) {
      // Als het label bestaat, werk het bij
      label.textContent = newName; // Update de naam in het label
      updateLabelPosition(shapeElement, label); // Update de positie van het label
    } else {
      // Als het label nog niet bestaat, maak het dan aan
      const newLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      newLabel.setAttribute('id', `${shapeId}-label`);
      newLabel.setAttribute('font-size', '12');
      newLabel.setAttribute('fill', 'black');
      newLabel.textContent = newName;
      updateLabelPosition(shapeElement, newLabel); // Zet de juiste positie van het label
      svg.appendChild(newLabel);
      bringLabelToFront(newLabel); // Breng het label naar voren
    }

    // Werk de vorm bij in de Firestore-database
    updateShapeInDB(shapeElement);
  }
});


// Event listener voor de showLabelCheckbox
showLabelCheckbox.addEventListener('change', () => {
  const shapeId = editPopup.getAttribute('data-id');
  const shapeElement = document.querySelector(`[data-id="${shapeId}"]`);
  const showLabel = showLabelCheckbox.checked;

  if (shapeElement) {
    const label = document.getElementById(`${shapeId}-label`);

    if (label) {
      // Maak het label zichtbaar of verberg het op basis van de checkbox
      if (showLabel) {
        label.style.display = 'inline'; // Maak label zichtbaar
        updateLabelPosition(shapeElement, label); // Update de positie van het label
        bringLabelToFront(label); // Breng het label naar voren
      } else {
        label.style.display = 'none'; // Verberg label
      }
    }

    // Werk de vorm bij in de Firestore-database
    updateShapeInDB(shapeElement);
  }
});

// Event listener voor de lockCheckbox
lockCheckbox.addEventListener('change', () => {
  const shapeId = editPopup.getAttribute('data-id');
  const shapeElement = document.querySelector(`[data-id="${shapeId}"]`);
  const isLocked = lockCheckbox.checked;

  if (shapeElement) {
    shapeElement.setAttribute('data-locked', isLocked ? "true" : "false");

    // Werk de vorm bij in de Firestore-database
    updateShapeInDB(shapeElement);
  }
});

//// vanaf hier ivm laden en opslaan
  // === Firebase SDK imports ===
    import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
    import {
      getFirestore,
      collection,
      getDocs,
      doc,
      getDoc,
      setDoc
    } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

  // DOM elementen
    const dropdown = document.getElementById("svgDropdown");
    const container = document.getElementById("svgContainer");

    // Laatst gekozen of opgeslagen bestandsnaam
    let laatstGebruikteBestandsnaam = "";

    // === 1. Laad alle opgeslagen SVG-bestanden in de dropdown ===
    async function laadSVGKeuzes() {
      dropdown.innerHTML = '<option value="">-- Kies een SVG --</option>';
      const svgCollectie = await getDocs(collection(db, "svg-files"));

      svgCollectie.forEach((docSnap) => {
        const optie = document.createElement("option");
        optie.value = docSnap.id;
        optie.textContent = docSnap.id;
        dropdown.appendChild(optie);
      });
    }

    // === 2. Laad de gekozen SVG in het bewerkingsvenster ===
    dropdown.addEventListener("change", async (e) => {
      const filename = e.target.value;
      if (!filename) return;

      const docSnap = await getDoc(doc(db, "svg-files", filename));
      if (docSnap.exists()) {
        container.innerHTML = docSnap.data().svg;
        laatstGebruikteBestandsnaam = filename; // onthoud gekozen bestand
      } else {
        alert("SVG niet gevonden.");
      }
    });

    // === 3. Maak een nieuwe lege SVG in het canvas ===
    function maakNieuweSVG() {
      const svgTemplate = `
        <svg xmlns="http://www.w3.org/2000/svg" width="300" height="300">

      `;
      container.innerHTML = svgTemplate;
      laatstGebruikteBestandsnaam = ""; // reset naam
      dropdown.value = ""; // reset dropdown
    }

    // === 4. Sla SVG op met naam (nieuw of overschrijven) ===
    async function slimOpslaanSVG() {
      const svgEl = container.querySelector("svg");
      if (!svgEl) {
        alert("Er is geen SVG om op te slaan.");
        return;
      }

      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgEl);

      // Vraag om bestandsnaam (met voorgestelde waarde)
      const filename = prompt(
        "Geef een bestandsnaam op:",
        laatstGebruikteBestandsnaam || "tekening.svg"
      );
      if (!filename) {
        alert("Opslaan geannuleerd.");
        return;
      }

      const docRef = doc(db, "svg-files", filename);
      const bestaandDoc = await getDoc(docRef);

      // Als bestand bestaat, vraag of je wilt overschrijven
      if (bestaandDoc.exists()) {
        const bevestig = confirm(`'${filename}' bestaat al. Overschrijven?`);
        if (!bevestig) {
          alert("Niet opgeslagen.");
          return;
        }
      }

      // Opslaan in Firestore
      await setDoc(docRef, {
        filename,
        svg: svgString,
        timestamp: new Date().toISOString(),
      });

      laatstGebruikteBestandsnaam = filename; // onthoud nieuwe naam
      alert(`SVG opgeslagen als '${filename}'`);

      // Refresh de dropdown
      await laadSVGKeuzes();
      dropdown.value = filename;
    }

    // === Init: laad dropdown bij opstart ===
    laadSVGKeuzes();

    // Exporteer functies voor knoppen
    window.slimOpslaanSVG = slimOpslaanSVG;
    window.maakNieuweSVG = maakNieuweSVG;
