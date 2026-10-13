// Complete 2025 IB Physics Syllabus Content Overview Dictionary
const SYLLABUS_THEMES = [
  { id: "A", name: "Theme A: Space, time and motion" },
  { id: "B", name: "Theme B: Particulate nature of matter" },
  { id: "C", name: "Theme C: Wave behaviour" },
  { id: "D", name: "Theme D: Fields" },
  { id: "E", name: "Theme E: Nuclear & quantum physics" }
];

const SYLLABUS_DB = {
  // Theme A
  "A.1": { code: "A.1", themeLetter: "A", name: "Kinematics" },
  "A.2": { code: "A.2", themeLetter: "A", name: "Forces and momentum" },
  "A.3": { code: "A.3", themeLetter: "A", name: "Work, energy and power" },
  "A.4": { code: "A.4", themeLetter: "A", name: "Rigid body mechanics (HL)" },
  "A.5": { code: "A.5", themeLetter: "A", name: "Galilean and special relativity (HL)" },

  // Theme B
  "B.1": { code: "B.1", themeLetter: "B", name: "Thermal energy transfers" },
  "B.2": { code: "B.2", themeLetter: "B", name: "Greenhouse effect" },
  "B.3": { code: "B.3", themeLetter: "B", name: "Gas laws" },
  "B.4": { code: "B.4", themeLetter: "B", name: "Thermodynamics (HL)" },
  "B.5": { code: "B.5", themeLetter: "B", name: "Current and circuits" },

  // Theme C
  "C.1": { code: "C.1", themeLetter: "C", name: "Simple harmonic motion" },
  "C.2": { code: "C.2", themeLetter: "C", name: "Wave model" },
  "C.3": { code: "C.3", themeLetter: "C", name: "Wave phenomena" },
  "C.4": { code: "C.4", themeLetter: "C", name: "Standing waves and resonance" },
  "C.5": { code: "C.5", themeLetter: "C", name: "Doppler effect" },

  // Theme D
  "D.1": { code: "D.1", themeLetter: "D", name: "Gravitational fields" },
  "D.2": { code: "D.2", themeLetter: "D", name: "Electric and magnetic fields" },
  "D.3": { code: "D.3", themeLetter: "D", name: "Motion in electromagnetic fields" },
  "D.4": { code: "D.4", themeLetter: "D", name: "Induction (HL)" },

  // Theme E
  "E.1": { code: "E.1", themeLetter: "E", name: "Structure of the atom" },
  "E.2": { code: "E.2", themeLetter: "E", name: "Quantum physics (HL)" },
  "E.3": { code: "E.3", themeLetter: "E", name: "Radioactive decay" },
  "E.4": { code: "E.4", themeLetter: "E", name: "Fission" },
  "E.5": { code: "E.5", themeLetter: "E", name: "Fusion and stars" }
};

// Tracks active topics for multi-select
let activeTopics = new Set(Object.keys(SYLLABUS_DB));

function resolveTopic(rawCode) {
  if (!rawCode) return { code: "General", themeLetter: "Other", name: "General Physics" };
  const cleaned = rawCode.trim().toUpperCase().replace(/^([A-E])(\d)$/, "$1.$2");
  return SYLLABUS_DB[cleaned] || { code: cleaned, themeLetter: cleaned.charAt(0), name: cleaned };
}

function cleanChoiceText(text) {
  if (!text) return "";
  return text.trim().replace(/^[A-Da-d][\.\)]\s*/, "");
}

let questions = [];
let selectedIds = new Set();

window.addEventListener('DOMContentLoaded', async () => {
  const cached = localStorage.getItem('ib_qbank');
  if (cached) {
    try {
      questions = JSON.parse(cached);
    } catch (e) {
      console.error("Local cache error:", e);
    }
  }

  if (!questions || questions.length === 0) {
    try {
      const res = await fetch('questions.json');
      if (res.ok) {
        questions = await res.json();
        localStorage.setItem('ib_qbank', JSON.stringify(questions));
      }
    } catch (err) {
      console.warn("Could not load questions.json, starting with empty bank.", err);
    }
  }

  selectedIds = new Set(questions.map(q => q.id));
  populateTopicModalDropdown();
  buildSyllabusFilterTree();
  renderQuestionList();
  renderWorksheet();
});

// Populates dropdown in the "+ New Question" modal
function populateTopicModalDropdown() {
  const select = document.getElementById('newTopicCode');
  if (!select) return;
  select.innerHTML = '';
  Object.keys(SYLLABUS_DB).forEach(key => {
    const item = SYLLABUS_DB[key];
    const opt = document.createElement('option');
    opt.value = item.code;
    opt.innerText = `${item.code} ${item.name} (Theme ${item.themeLetter})`;
    select.appendChild(opt);
  });
}

// Builds the multi-select sidebar tree grouped by Theme
function buildSyllabusFilterTree() {
  const container = document.getElementById('syllabusTreeContainer');
  if (!container) return;
  container.innerHTML = '';

  SYLLABUS_THEMES.forEach(theme => {
    const themeWrapper = document.createElement('div');
    themeWrapper.style.marginBottom = '6px';

    // Theme header with master checkbox
    const themeHeader = document.createElement('div');
    themeHeader.style.cssText = 'display:flex; align-items:center; gap:6px; font-weight:700; font-size:12px; color:#1e293b; background:#f8fafc; padding:3px 5px; border-radius:4px;';
    themeHeader.innerHTML = `
      <input type="checkbox" id="theme_chk_${theme.id}" checked onchange="toggleEntireTheme('${theme.id}', this.checked)">
      <label for="theme_chk_${theme.id}" style="cursor:pointer; flex:1;">${theme.name}</label>
    `;
    themeWrapper.appendChild(themeHeader);

    // Topic child checkboxes under this theme
    const topicList = document.createElement('div');
    topicList.style.cssText = 'padding-left:18px; margin-top:2px; display:flex; flex-direction:column; gap:2px;';

    Object.keys(SYLLABUS_DB).forEach(key => {
      const topic = SYLLABUS_DB[key];
      if (topic.themeLetter === theme.id) {
        const item = document.createElement('label');
        item.style.cssText = 'font-size:11.5px; color:#334155; display:flex; align-items:center; gap:5px; cursor:pointer;';
        item.innerHTML = `
          <input type="checkbox" class="topic-checkbox" data-theme="${theme.id}" value="${topic.code}" checked onchange="onTopicCheckChange('${theme.id}', '${topic.code}', this.checked)">
          <span><b>${topic.code}</b> ${topic.name}</span>
        `;
        topicList.appendChild(item);
      }
    });

    themeWrapper.appendChild(topicList);
    container.appendChild(themeWrapper);
  });
}

// Toggles all topics in a theme
function toggleEntireTheme(themeId, isChecked) {
  const checkboxes = document.querySelectorAll(`.topic-checkbox[data-theme="${themeId}"]`);
  checkboxes.forEach(chk => {
    chk.checked = isChecked;
    if (isChecked) activeTopics.add(chk.value);
    else activeTopics.delete(chk.value);
  });
  renderQuestionList();
}

// Toggles an individual topic and updates the parent theme checkbox
function onTopicCheckChange(themeId, topicCode, isChecked) {
  if (isChecked) activeTopics.add(topicCode);
  else activeTopics.delete(topicCode);

  const themeBoxes = Array.from(document.querySelectorAll(`.topic-checkbox[data-theme="${themeId}"]`));
  const masterBox = document.getElementById(`theme_chk_${themeId}`);
  if (masterBox) {
    masterBox.checked = themeBoxes.some(chk => chk.checked);
  }

  renderQuestionList();
}

// Select All / Clear All helper
function selectAllFilters(selectState) {
  activeTopics.clear();
  document.querySelectorAll('.topic-checkbox').forEach(chk => {
    chk.checked = selectState;
    if (selectState) activeTopics.add(chk.value);
  });
  SYLLABUS_THEMES.forEach(t => {
    const master = document.getElementById(`theme_chk_${t.id}`);
    if (master) master.checked = selectState;
  });
  renderQuestionList();
}

// Filters the sidebar list against active topics and selected paper
function renderQuestionList() {
  const filterPaper = document.getElementById('filterPaper').value;
  const container = document.getElementById('qListContainer');
  container.innerHTML = '';

  const filtered = questions.filter(q => {
    const meta = resolveTopic(q.topic);
    const matchesTopic = activeTopics.has(meta.code);
    const matchesPaper = (filterPaper === 'ALL' || q.paper === filterPaper);

    return matchesTopic && matchesPaper;
  });

  if (filtered.length === 0) {
    container.innerHTML = '<p style="text-align:center; color:#94a3b8; font-size:13px; margin-top:20px;">No questions match filter criteria.</p>';
    return;
  }

  filtered.forEach(q => {
    const meta = resolveTopic(q.topic);
    const card = document.createElement('div');
    card.className = 'q-bank-card';
    card.innerHTML = `
      <input type="checkbox" ${selectedIds.has(q.id) ? 'checked' : ''} onclick="event.stopPropagation(); toggleSelect('${q.id}')">
      <div style="flex:1; font-size:13px;" onclick="openViewer('${q.id}')">
        <div style="display:flex; justify-content:space-between;">
          <strong>[${q.id}]</strong>
          <span style="color:#64748b;">${q.marks} mk</span>
        </div>
        <div style="color:#475569; margin:2px 0;">${meta.code} ${meta.name} &bull; Paper ${q.paper} (${q.level})</div>
      </div>
    `;
    container.appendChild(card);
  });
}

function toggleSelect(id) {
  if (selectedIds.has(id)) selectedIds.delete(id);
  else selectedIds.add(id);
  renderWorksheet();
}

// Render printable A4 worksheet
function renderWorksheet() {
  const container = document.getElementById('worksheetQuestionsContainer');
  container.innerHTML = '';
  let qNum = 1;

  questions.forEach(q => {
    if (!selectedIds.has(q.id)) return;

    const el = document.createElement('div');
    el.className = 'worksheet-q';

    let optionsMarkup = '';
    if (q.paper === '1A' && q.choices && q.choices.length > 0) {
      const letters = ['A', 'B', 'C', 'D'];
      optionsMarkup = '<ol type="A" style="margin: 8px 0 0 18px; padding: 0;">' + 
        q.choices.map((c, i) => `<li style="margin-bottom:4px;"><b>${letters[i]}.</b> ${cleanChoiceText(c)}</li>`).join('') +
        '</ol>';
    }

    let answerBoxMarkup = '';
    if (q.paper !== '1A') {
      const boxHeight = Math.max(70, q.marks * 25);
      answerBoxMarkup = `<div class="answer-lines" style="height:${boxHeight}px;"></div>`;
    }

    el.innerHTML = `
      <div class="q-header-row">
        <div>
          <strong>Q${qNum}.</strong>
          <span class="badge badge-level">${q.level}</span>
          <span class="badge badge-paper">Paper ${q.paper}</span>
        </div>
        <span style="font-size:12px; font-style:italic; color:#475569;">[${q.marks} mark${q.marks > 1 ? 's' : ''}]</span>
      </div>
      <div style="font-size:14px; line-height:1.5;">${q.text}</div>
      ${optionsMarkup}
      ${answerBoxMarkup}
    `;

    container.appendChild(el);
    qNum++;
  });

  renderMath();
}

function renderMath() {
  if (window.renderMathInElement) {
    renderMathInElement(document.body, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false }
      ]
    });
  }
}

// Viewer modal to inspect question statement & mark scheme
function openViewer(id) {
  const q = questions.find(item => item.id === id);
  if (!q) return;

  const meta = resolveTopic(q.topic);
  document.getElementById('viewerTitle').innerText = `[${q.id}] ${meta.code} ${meta.name}`;

  let choicesMarkup = '';
  if (q.paper === '1A' && q.choices && q.choices.length > 0) {
    const letters = ['A', 'B', 'C', 'D'];
    choicesMarkup = '<div style="margin: 10px 0;"><strong>Options:</strong><ul style="list-style:none; padding-left:0; margin-top:4px;">' +
      q.choices.map((c, i) => `<li style="margin-bottom:4px;"><b>${letters[i]}.</b> ${cleanChoiceText(c)}</li>`).join('') +
      '</ul></div>';
  }

  document.getElementById('viewerBody').innerHTML = `
    <div style="margin-bottom: 12px;">
      <span class="badge badge-level">${q.level}</span>
      <span class="badge badge-paper">Paper ${q.paper}</span>
      <span style="float:right; font-weight:bold;">${q.marks} Mark${q.marks > 1 ? 's' : ''}</span>
    </div>
    <div style="font-size:14px; line-height:1.5; margin-bottom:14px; background:#f8fafc; padding:12px; border-radius:6px; border:1px solid #e2e8f0;">
      <strong>Question Statement:</strong><br>${q.text}
    </div>
    ${choicesMarkup}
    <div style="background:#f0fdf4; border:1px solid #bbf7d0; padding:12px; border-radius:6px; font-size:13px;">
      <strong style="color:#166534;">Mark Scheme / Solution:</strong><br>
      ${q.solution || 'No worked solution registered.'}
    </div>
  `;

  document.getElementById('viewerModal').style.display = 'flex';
  renderMath();
}

function closeViewerModal() {
  document.getElementById('viewerModal').style.display = 'none';
}

// Add Question modal handlers
function openAddModal() {
  document.getElementById('addModal').style.display = 'flex';
}

function closeAddModal() {
  document.getElementById('addModal').style.display = 'none';
}

function toggleOptionFields() {
  const p = document.getElementById('newPaper').value;
  document.getElementById('mcOptionsGroup').style.display = (p === '1A') ? 'block' : 'none';
  if (p === '1A') document.getElementById('newMarks').value = 1;
}

function saveNewQuestion() {
  const id = document.getElementById('newId').value.trim() || 'Q-' + Date.now();
  const topic = document.getElementById('newTopicCode').value;
  const paper = document.getElementById('newPaper').value;
  const level = document.getElementById('newLevel').value;
  const marks = parseInt(document.getElementById('newMarks').value, 10) || 1;
  const text = document.getElementById('newText').value.trim();
  const solution = document.getElementById('newSolution').value.trim();

  let choices = [];
  if (paper === '1A') {
    choices = [
      cleanChoiceText(document.getElementById('optA').value),
      cleanChoiceText(document.getElementById('optB').value),
      cleanChoiceText(document.getElementById('optC').value),
      cleanChoiceText(document.getElementById('optD').value)
    ];
  }

  if (!text) {
    alert("Please provide the question statement.");
    return;
  }

  const newQ = { id, topic, paper, level, marks, text, choices, solution };
  questions.push(newQ);
  selectedIds.add(newQ.id);

  localStorage.setItem('ib_qbank', JSON.stringify(questions));
  closeAddModal();
  renderQuestionList();
  renderWorksheet();
}

// Export and Import JSON backups
function exportJSON() {
  const blob = new Blob([JSON.stringify(questions, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'questions.json';
  a.click();
}

function importJSON(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(evt) {
    try {
      const imported = JSON.parse(evt.target.result);
      if (Array.isArray(imported)) {
        questions = imported;
        selectedIds = new Set(questions.map(q => q.id));
        localStorage.setItem('ib_qbank', JSON.stringify(questions));
        renderQuestionList();
        renderWorksheet();
        alert('Question bank imported successfully!');
      }
    } catch(err) {
      alert('Invalid JSON file format.');
    }
  };
  reader.readAsText(file);
}
