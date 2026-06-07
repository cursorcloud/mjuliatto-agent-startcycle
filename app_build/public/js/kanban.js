// Claude Code-Style Kanban Board JavaScript

// Initial Dummy Tasks if none exist in localStorage
const DUMMY_TASKS = [
  { id: 1, title: 'Design system specification with Claude colors', category: 'Design', tags: ['ui', 'apple', 'claude'], status: 'Done' },
  { id: 2, title: 'Integrate customer chat widget client-side logic', category: 'Feature', tags: ['websocket', 'chat'], status: 'Doing' },
  { id: 3, title: 'Fix SVG gradient rendering bug on first load', category: 'Bug', tags: ['render', 'safari'], status: 'To Do' },
  { id: 4, title: 'Write deployment guide and Dockerfile setup', category: 'Docs', tags: ['devops', 'guide'], status: 'Funnel' }
];

let tasks = [];
let nextId = 1;
let currentView = 'board'; // board or list

// DOM Elements
const kanbanBoard = document.getElementById('kanbanBoard');
const listView = document.getElementById('listView');
const toggleViewBtn = document.getElementById('toggleViewBtn');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskModal = document.getElementById('taskModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelModalBtn = document.getElementById('cancelModalBtn');
const taskForm = document.getElementById('taskForm');
const listTableBody = document.getElementById('listTableBody');
const noPendingMessage = document.getElementById('noPendingMessage');

// Load Data
function loadData() {
  const storedTasks = localStorage.getItem('auratech_kanban_tasks');
  const storedNextId = localStorage.getItem('auratech_kanban_next_id');

  if (storedTasks) {
    tasks = JSON.parse(storedTasks);
  } else {
    tasks = [...DUMMY_TASKS];
    saveTasks();
  }

  if (storedNextId) {
    nextId = parseInt(storedNextId);
  } else {
    nextId = 5;
    localStorage.setItem('auratech_kanban_next_id', nextId.toString());
  }
}

// Save Data
function saveTasks() {
  localStorage.setItem('auratech_kanban_tasks', JSON.stringify(tasks));
}

function updateNextId() {
  localStorage.setItem('auratech_kanban_next_id', nextId.toString());
}

// --- RENDER BOARDS ---
function renderBoard() {
  // Clear lists
  const cols = ['Funnel', 'To Do', 'Doing', 'Done'];
  cols.forEach(col => {
    const listId = `cards-${col.toLowerCase().replace(' ', '')}`;
    const listEl = document.getElementById(listId);
    if (listEl) listEl.innerHTML = '';
  });

  // Render cards
  tasks.forEach(task => {
    const listId = `cards-${task.status.toLowerCase().replace(' ', '')}`;
    const listEl = document.getElementById(listId);
    if (listEl) {
      const cardEl = createCardElement(task);
      listEl.appendChild(cardEl);
    }
  });

  // Update column counters
  cols.forEach(col => {
    const countId = `count-${col.toLowerCase().replace(' ', '')}`;
    const countEl = document.getElementById(countId);
    if (countEl) {
      const count = tasks.filter(t => t.status === col).length;
      countEl.textContent = count;
    }
  });
}

// Create Card Element
function createCardElement(task) {
  const card = document.createElement('div');
  card.className = 'kanban-card';
  card.draggable = true;
  card.dataset.id = task.id;

  // Header (ID + Delete icon)
  const topRow = document.createElement('div');
  topRow.className = 'card-top';
  
  const cardId = document.createElement('span');
  cardId.className = 'card-id';
  cardId.textContent = `K-${task.id}`;
  
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'delete-card-btn';
  deleteBtn.setAttribute('aria-label', 'Delete card');
  deleteBtn.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      <line x1="10" y1="11" x2="10" y2="17"></line>
      <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
  `;
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    deleteTask(task.id);
  });

  topRow.appendChild(cardId);
  topRow.appendChild(deleteBtn);

  // Title
  const title = document.createElement('div');
  title.className = 'card-title';
  title.textContent = task.title;

  // Bottom row (Category + Tags)
  const tagsRow = document.createElement('div');
  tagsRow.className = 'card-tags';

  // Category Badge
  const catBadge = document.createElement('span');
  catBadge.className = `badge-category cat-${task.category.toLowerCase()}`;
  catBadge.textContent = task.category;
  tagsRow.appendChild(catBadge);

  // Tags
  if (task.tags && task.tags.length > 0) {
    task.tags.forEach(tag => {
      const tagBadge = document.createElement('span');
      tagBadge.className = 'badge-tag';
      tagBadge.textContent = tag;
      tagsRow.appendChild(tagBadge);
    });
  }

  card.appendChild(topRow);
  card.appendChild(title);
  card.appendChild(tagsRow);

  // Drag Events
  card.addEventListener('dragstart', handleDragStart);
  card.addEventListener('dragend', handleDragEnd);

  return card;
}

// --- DRAG AND DROP HANDLERS ---
let draggedCard = null;

function handleDragStart(e) {
  draggedCard = this;
  this.classList.add('dragging');
  e.dataTransfer.setData('text/plain', this.dataset.id);
  e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd() {
  this.classList.remove('dragging');
  draggedCard = null;
}

// Setup Column Drag Event Listeners
const columns = document.querySelectorAll('.kanban-column');
columns.forEach(col => {
  const cardsContainer = col.querySelector('.column-cards');
  
  cardsContainer.addEventListener('dragover', (e) => {
    e.preventDefault();
    cardsContainer.classList.add('drag-over');
  });

  cardsContainer.addEventListener('dragenter', (e) => {
    e.preventDefault();
  });

  cardsContainer.addEventListener('dragleave', () => {
    cardsContainer.classList.remove('drag-over');
  });

  cardsContainer.addEventListener('drop', (e) => {
    e.preventDefault();
    cardsContainer.classList.remove('drag-over');

    const cardId = parseInt(e.dataTransfer.getData('text/plain') || (draggedCard ? draggedCard.dataset.id : ''));
    if (isNaN(cardId)) return;

    const task = tasks.find(t => t.id === cardId);
    const newStatus = col.dataset.status;

    if (task && task.status !== newStatus) {
      task.status = newStatus;
      saveTasks();
      
      // Celebrate if moved to Done
      if (newStatus === 'Done') {
        fireConfetti();
      }

      renderBoard();
      renderList();
    }
  });
});

// Celebrate Confetti
function fireConfetti() {
  confetti({
    particleCount: 120,
    spread: 70,
    origin: { y: 0.65 }
  });
}

// Delete Task
function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  renderBoard();
  renderList();
}

// --- LIST VIEW (PENDING TASKS ONLY) ---
function renderList() {
  listTableBody.innerHTML = '';
  
  // Exclude completed tasks
  const pendingTasks = tasks.filter(t => t.status !== 'Done');

  if (pendingTasks.length === 0) {
    noPendingMessage.classList.remove('hidden');
    listTableBody.parentElement.classList.add('hidden');
    return;
  }

  noPendingMessage.classList.add('hidden');
  listTableBody.parentElement.classList.remove('hidden');

  pendingTasks.forEach(task => {
    const row = document.createElement('tr');

    // ID Column
    const tdId = document.createElement('td');
    tdId.className = 'card-id';
    tdId.textContent = `K-${task.id}`;

    // Title Column
    const tdTitle = document.createElement('td');
    tdTitle.textContent = task.title;
    tdTitle.style.fontWeight = '600';

    // Category Column
    const tdCat = document.createElement('td');
    tdCat.innerHTML = `<span class="badge-category cat-${task.category.toLowerCase()}">${task.category}</span>`;

    // Tags Column
    const tdTags = document.createElement('td');
    if (task.tags && task.tags.length > 0) {
      task.tags.forEach(tag => {
        const span = document.createElement('span');
        span.className = 'badge-tag';
        span.style.marginRight = '4px';
        span.textContent = tag;
        tdTags.appendChild(span);
      });
    } else {
      tdTags.textContent = '-';
    }

    // Status Column
    const tdStatus = document.createElement('td');
    let statusClass = 'status-funnel';
    if (task.status === 'To Do') statusClass = 'status-todo';
    if (task.status === 'Doing') statusClass = 'status-doing';
    tdStatus.innerHTML = `<span class="badge-status ${statusClass}">${task.status}</span>`;

    // Actions Column
    const tdActions = document.createElement('td');
    const advanceBtn = document.createElement('button');
    advanceBtn.className = 'action-row-btn';
    
    // Choose next status text
    let nextStatusText = '';
    let nextStatus = '';
    if (task.status === 'Funnel') {
      nextStatusText = 'Move to To Do';
      nextStatus = 'To Do';
    } else if (task.status === 'To Do') {
      nextStatusText = 'Start Work';
      nextStatus = 'Doing';
    } else if (task.status === 'Doing') {
      nextStatusText = 'Mark Completed';
      nextStatus = 'Done';
    }

    advanceBtn.innerHTML = `
      <span>${nextStatusText}</span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
    `;

    advanceBtn.addEventListener('click', () => {
      task.status = nextStatus;
      saveTasks();
      if (nextStatus === 'Done') {
        fireConfetti();
      }
      renderBoard();
      renderList();
    });

    tdActions.appendChild(advanceBtn);

    row.appendChild(tdId);
    row.appendChild(tdTitle);
    row.appendChild(tdCat);
    row.appendChild(tdTags);
    row.appendChild(tdStatus);
    row.appendChild(tdActions);

    listTableBody.appendChild(row);
  });
}

// --- TOGGLE VIEW ACTION ---
toggleViewBtn.addEventListener('click', () => {
  if (currentView === 'board') {
    currentView = 'list';
    kanbanBoard.classList.add('hidden');
    listView.classList.remove('hidden');
    toggleViewBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>
      Show Board View
    `;
    renderList();
  } else {
    currentView = 'board';
    listView.classList.add('hidden');
    kanbanBoard.classList.remove('hidden');
    toggleViewBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
      Show List View
    `;
    renderBoard();
  }
});

// --- MODAL DIALOG ACTIONS ---
addTaskBtn.addEventListener('click', () => {
  taskModal.classList.remove('hidden');
  document.getElementById('taskTitle').focus();
});

function hideModal() {
  taskModal.classList.add('hidden');
  taskForm.reset();
}

closeModalBtn.addEventListener('click', hideModal);
cancelModalBtn.addEventListener('click', hideModal);
taskModal.addEventListener('click', (e) => {
  if (e.target === taskModal) {
    hideModal();
  }
});

// Form Submission
taskForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const title = document.getElementById('taskTitle').value.trim();
  const category = document.getElementById('taskCategory').value;
  const status = document.getElementById('taskStatus').value;
  const rawTags = document.getElementById('taskTags').value;

  // Format Tags
  const tagsList = rawTags
    .split(',')
    .map(t => t.trim().toLowerCase())
    .filter(t => t !== '');

  const newTask = {
    id: nextId,
    title: title,
    category: category,
    tags: tagsList,
    status: status
  };

  tasks.push(newTask);
  saveTasks();

  nextId++;
  updateNextId();

  hideModal();
  renderBoard();
  renderList();
});

// Initial Setup
loadData();
renderBoard();
renderList();
