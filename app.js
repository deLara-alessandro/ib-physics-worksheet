let questions = [];
let selectedIds = new Set();

// Load questions on startup: local cache first, fallback to questions.json
window.addEventListener('DOMContentLoaded', async () => {
  const cached = localStorage.getItem('ib_qbank');
  if (cached) {
    try {
      questions = JSON.parse(cached);
    } catch (e) {
      console.error("Local cache parse error:", e);
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
      console.warn("Could not fetch questions.json; using empty bank.", err);
    }
  }

  selectedIds = new Set(questions.map(q => q.id));
  renderQuestionList();
  renderWorksheet();
});

// Render the sidebar checklist
function renderQuestionList() {
  const filterTheme = document.getElementById('filterTheme').value;
  const filterPaper = document.getElementById('filterPaper').value;
  const container = document.getElementById('qListContainer');
  container.innerHTML = '';

  const filtered = questions.filter(q => {
    const matchesTheme = (filterTheme === 'ALL' || q.theme === filterTheme);
    const matchesPaper = (filterPaper === 'ALL' || q.paper === filterPaper);
    return matchesTheme && matchesPaper;
  });

  if (filtered.length === 0) {
    container.innerHTML = '<p style="text-align:center; color:#94a3b8; font-size:13px;">No questions match filter.</p>';
    return;
  }

  filtered.forEach(q => {
    const card = document.createElement('div');
    card.className = 'q-bank-card';
    card.innerHTML = `
      <input type="checkbox" ${selectedIds.has(q.id) ? 'checked' : ''} onclick="event.stopPropagation(); toggleSelect('${q.id}')">
      <div style="flex:1; font-size:13px;" onclick="openViewer('${q.id}')">
        <div style="display:flex; justify-content:space-between;">
          <strong>[${q.id}]</strong>
          <span style="color:#64748b;">${q.marks} mk</span>
        </div>
        <div style="color:#475569; margin:2px 0;">${q.topic} &bull; Paper ${q.paper} (${q.level})</div>
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

// Render the A4 printable worksheet
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
        q.choices.map((c, i) => `<li style="margin-bottom:4px;"><b>${letters[i]}.</b> ${c}</li>`).join('') +
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

// Render math notation with KaTeX
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

// Viewer modal to inspect question details and markscheme
function openViewer(id) {
  const q = questions.find(item => item.id === id);
  if (!q) return;

  document.getElementById('viewerTitle').innerText = `[${q.id}] ${q.topic}`;
  
  let choicesMarkup = '';
  if (q.paper === '1A' && q.choices && q.choices.length > 0) {
    const letters = ['A', 'B', 'C', 'D'];
    choicesMarkup = '<div style="margin: 10px 0;"><strong>Options:</strong><ul>' +
      q.choices.map((c, i) => `<li><b>${letters[i]}.</b> ${c}</li>`).join('') +
      '</ul></div>';
  }

  document.getElementById('viewerBody').innerHTML = `
    <div style="margin-bottom: 12px;">
      <span class="badge badge-level">${q.level}</span>
      <span class="badge badge-paper">Paper ${q.paper}</span>
      <span style="float:right; font-weight:bold;">${q.marks} Marks</span>
    </div>
    <div style="font-size:14px; line-height:1.5; margin-bottom:14px; background:#f8fafc; padding:12px; border-radius:6px; border:1px solid #e2e8f0;">
      <strong>Question:</strong><br>${q.text}
    </div>
    ${choicesMarkup}
    <div style="background:#f0fdf4; border:1px solid #bbf7d0; padding:12px; border-radius:6px; font-size:13px;">
      <strong style="color:#166534;">Solution / Mark Scheme:</strong><br>
      ${q.solution || 'No mark scheme registered.'}
    </div>
  `;

  document.getElementById('viewerModal').style.display = 'flex';
  renderMath();
}

function closeViewerModal() {
  document.getElementById('viewerModal').style.display = 'none';
}

// New question modal handlers
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
  const theme = document.getElementById('newTheme').value;
  const topic = document.getElementById('newTopic').value.trim() || 'General Physics';
  const paper = document.getElementById('newPaper').value;
  const level = document.getElementById('newLevel').value;
  const marks = parseInt(document.getElementById('newMarks').value, 10) || 1;
  const text = document.getElementById('newText').value.trim();
  const solution = document.getElementById('newSolution').value.trim();

  let choices = [];
  if (paper === '1A') {
    choices = [
      document.getElementById('optA').value.trim(),
      document.getElementById('optB').value.trim(),
      document.getElementById('optC').value.trim(),
      document.getElementById('optD').value.trim()
    ];
  }

  if (!text) {
    alert("Please provide the question statement.");
    return;
  }

  const newQ = { id, theme, topic, paper, level, marks, text, choices, solution };
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
