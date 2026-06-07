(function() {
  let socket = null;
  let agentId = localStorage.getItem('agent_id') || null;
  let agentName = localStorage.getItem('agent_name') || 'Support Specialist';
  let sessions = {};
  let selectedSessionId = null;
  let isTyping = false;
  let typingTimeout = null;

  // DOM Elements
  const wsStatus = document.getElementById('wsStatus');
  
  const queueCount = document.getElementById('queueCount');
  const queueList = document.getElementById('queueList');
  
  const activeCount = document.getElementById('activeCount');
  const activeList = document.getElementById('activeList');
  
  const closedCount = document.getElementById('closedCount');
  const closedList = document.getElementById('closedList');
  
  const workspaceEmpty = document.getElementById('workspaceEmpty');
  const workspaceActive = document.getElementById('workspaceActive');
  
  const currentCustomerName = document.getElementById('currentCustomerName');
  const currentCustomerEmail = document.getElementById('currentCustomerEmail');
  const claimChatBtn = document.getElementById('claimChatBtn');
  const closeChatBtn = document.getElementById('closeChatBtn');
  
  const agentMessageList = document.getElementById('agentMessageList');
  const customerTypingIndicator = document.getElementById('customerTypingIndicator');
  
  const cannedSelect = document.getElementById('cannedSelect');
  const agentMessageForm = document.getElementById('agentMessageForm');
  const agentMessageInput = document.getElementById('agentMessageInput');
  const alertSound = document.getElementById('alertSound');

  // Initialize
  init();

  function init() {
    if (!agentId) {
      agentId = crypto.randomUUID();
      localStorage.setItem('agent_id', agentId);
    }
    
    connectWebSocket();

    // Event Listeners
    agentMessageForm.addEventListener('submit', handleSendMessage);
    agentMessageInput.addEventListener('input', handleTypingInput);
    
    claimChatBtn.addEventListener('click', handleClaimChat);
    closeChatBtn.addEventListener('click', handleCloseChat);
    
    cannedSelect.addEventListener('change', handleCannedReplySelect);
  }

  function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    console.log(`Agent connecting to WebSocket at ${wsUrl}`);
    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('Agent WebSocket connection established');
      wsStatus.className = 'connection-status connected';
      
      // Initialize agent state on server
      socket.send(JSON.stringify({
        type: 'agent_init',
        payload: {
          agentId: agentId,
          name: agentName
        }
      }));
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const { type, payload } = data;

        switch (type) {
          case 'init_ok': {
            agentId = payload.agentId;
            sessions = payload.sessions;
            updateSidebar();
            
            // Restore selection if session still active
            if (selectedSessionId && sessions[selectedSessionId]) {
              selectSession(selectedSessionId);
            }
            break;
          }

          case 'sessions_update': {
            sessions = payload;
            updateSidebar();
            
            if (selectedSessionId) {
              const updatedSession = sessions[selectedSessionId];
              if (updatedSession) {
                // Refresh main chat area
                renderCurrentMessages(updatedSession.messages);
                updateWorkspaceActions(updatedSession);
              } else {
                // Selected session was deleted/removed
                selectedSessionId = null;
                showEmptyWorkspace();
              }
            }
            break;
          }

          case 'msg': {
            const { sessionId, message } = payload;
            if (sessions[sessionId]) {
              sessions[sessionId].messages.push(message);
              updateSidebar();
              
              if (selectedSessionId === sessionId) {
                appendMessage(message);
                scrollToBottom();
              }
            }
            break;
          }

          case 'new_queue_alert': {
            // Play notification alert for new queue customer
            playNotification();
            flashBrowserTitle(`New Chat: ${payload.name}`);
            break;
          }

          case 'typing': {
            const { sessionId, sender, isTyping } = payload;
            if (selectedSessionId === sessionId && sender === 'customer') {
              if (isTyping) {
                customerTypingIndicator.classList.remove('hidden');
                scrollToBottom();
              } else {
                customerTypingIndicator.classList.add('hidden');
              }
            }
            break;
          }
        }
      } catch (err) {
        console.error('Error handling agent socket message:', err);
      }
    };

    socket.onclose = () => {
      console.log('Agent WebSocket disconnected. Retrying in 3 seconds...');
      wsStatus.className = 'connection-status';
      setTimeout(connectWebSocket, 3000);
    };
  }

  function updateSidebar() {
    // Categories
    const queue = [];
    const active = [];
    const closed = [];

    Object.keys(sessions).forEach(id => {
      const s = sessions[id];
      if (s.status === 'queue') {
        queue.push(s);
      } else if (s.status === 'active' && s.agentId === agentId) {
        active.push(s);
      } else if (s.status === 'closed') {
        closed.push(s);
      }
    });

    // Update Counts
    queueCount.textContent = queue.length;
    activeCount.textContent = active.length;
    closedCount.textContent = closed.length;

    // Render lists
    renderList(queueList, queue, 'queue');
    renderList(activeList, active, 'active');
    renderList(closedList, closed, 'closed');
  }

  function renderList(container, list, statusType) {
    container.innerHTML = '';
    
    if (list.length === 0) {
      const placeholder = document.createElement('div');
      placeholder.className = 'empty-list-placeholder';
      placeholder.textContent = `No ${statusType} chats`;
      container.appendChild(placeholder);
      return;
    }

    list.forEach(session => {
      const card = document.createElement('div');
      card.className = `session-card ${selectedSessionId === session.id ? 'selected' : ''}`;
      card.addEventListener('click', () => selectSession(session.id));

      const header = document.createElement('div');
      header.className = 'session-card-header';

      const nameSpan = document.createElement('span');
      nameSpan.className = 'session-name';
      nameSpan.textContent = session.name;
      header.appendChild(nameSpan);

      const statusDot = document.createElement('span');
      statusDot.className = `session-status-dot ${session.online ? 'online' : 'offline'}`;
      statusDot.title = session.online ? 'Online' : 'Offline';
      header.appendChild(statusDot);

      card.appendChild(header);

      const preview = document.createElement('div');
      preview.className = 'session-preview';
      
      // Get last message text
      const lastMsg = session.messages.filter(m => m.sender !== 'system').slice(-1)[0];
      preview.textContent = lastMsg ? `${lastMsg.sender === 'agent' ? 'You: ' : ''}${lastMsg.text}` : session.email;
      card.appendChild(preview);

      container.appendChild(card);
    });
  }

  function selectSession(sessionId) {
    selectedSessionId = sessionId;
    const session = sessions[sessionId];

    if (!session) {
      showEmptyWorkspace();
      return;
    }

    // Toggle View
    workspaceEmpty.classList.add('hidden');
    workspaceActive.classList.remove('hidden');

    // Populate metadata
    currentCustomerName.textContent = session.name;
    currentCustomerEmail.textContent = `${session.email} • ${session.online ? 'Online' : 'Offline'}`;

    // Refresh Sidebar visual selection
    updateSidebar();

    // Render conversation
    renderCurrentMessages(session.messages);
    updateWorkspaceActions(session);
    scrollToBottom();
    
    // Auto-focus input if chat claimed
    if (session.status === 'active') {
      agentMessageInput.focus();
    }
  }

  function showEmptyWorkspace() {
    workspaceEmpty.classList.remove('hidden');
    workspaceActive.classList.add('hidden');
  }

  function renderCurrentMessages(messages) {
    agentMessageList.innerHTML = '';
    messages.forEach(msg => appendMessage(msg));
  }

  function appendMessage(msg) {
    // Prevent duplicate renders
    if (document.getElementById(`agent-msg-${msg.id}`)) return;

    const bubble = document.createElement('div');
    bubble.id = `agent-msg-${msg.id}`;
    bubble.className = `message-bubble ${msg.sender}`;

    const textSpan = document.createElement('span');
    textSpan.innerText = msg.text;
    bubble.appendChild(textSpan);

    const timeSpan = document.createElement('span');
    timeSpan.className = 'msg-meta';
    const time = new Date(msg.timestamp);
    timeSpan.innerText = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    bubble.appendChild(timeSpan);

    agentMessageList.appendChild(bubble);
  }

  function updateWorkspaceActions(session) {
    if (session.status === 'queue') {
      claimChatBtn.classList.remove('hidden');
      closeChatBtn.classList.add('hidden');
      document.querySelector('.workspace-footer').classList.add('hidden');
    } else if (session.status === 'active') {
      claimChatBtn.classList.add('hidden');
      closeChatBtn.classList.remove('hidden');
      document.querySelector('.workspace-footer').classList.remove('hidden');
      agentMessageInput.disabled = false;
      agentMessageInput.placeholder = 'Type your message...';
      agentMessageForm.querySelector('button').disabled = false;
    } else if (session.status === 'closed') {
      claimChatBtn.classList.add('hidden');
      closeChatBtn.classList.add('hidden');
      document.querySelector('.workspace-footer').classList.add('hidden');
    }
  }

  function handleClaimChat() {
    if (!selectedSessionId || !socket || socket.readyState !== 1) return;

    socket.send(JSON.stringify({
      type: 'claim',
      payload: {
        sessionId: selectedSessionId,
        agentId: agentId,
        agentName: agentName
      }
    }));
  }

  function handleCloseChat() {
    if (!selectedSessionId || !socket || socket.readyState !== 1) return;

    if (confirm('Are you sure you want to end this conversation?')) {
      socket.send(JSON.stringify({
        type: 'close',
        payload: {
          sessionId: selectedSessionId
        }
      }));
    }
  }

  function handleSendMessage(e) {
    e.preventDefault();
    const text = agentMessageInput.value.trim();
    if (!text || !selectedSessionId || !socket || socket.readyState !== 1) return;

    socket.send(JSON.stringify({
      type: 'msg',
      payload: {
        sessionId: selectedSessionId,
        text: text,
        sender: 'agent'
      }
    }));

    agentMessageInput.value = '';
    sendTypingStatus(false);
  }

  function handleTypingInput() {
    sendTypingStatus(true);
    
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      sendTypingStatus(false);
    }, 1500);
  }

  function sendTypingStatus(typingState) {
    if (isTyping === typingState || !socket || socket.readyState !== 1 || !selectedSessionId) return;
    
    isTyping = typingState;
    socket.send(JSON.stringify({
      type: 'typing',
      payload: {
        sessionId: selectedSessionId,
        isTyping: isTyping,
        sender: 'agent'
      }
    }));
  }

  function handleCannedReplySelect() {
    const reply = cannedSelect.value;
    if (!reply) return;

    agentMessageInput.value = reply;
    cannedSelect.value = ''; // Reset select
    agentMessageInput.focus();
    handleTypingInput();
  }

  function playNotification() {
    try {
      // Basic synthesizer sound because audio file is stored as inline base64 beep
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.log('Audio alert failed or blocked by autoplay policy:', e);
    }
  }

  function flashBrowserTitle(message) {
    const originalTitle = document.title;
    let isFlashed = false;
    
    const interval = setInterval(() => {
      document.title = isFlashed ? originalTitle : message;
      isFlashed = !isFlashed;
    }, 1000);

    // Stop flashing when user clicks anywhere in the window
    const stopFlashing = () => {
      clearInterval(interval);
      document.title = originalTitle;
      window.removeEventListener('focus', stopFlashing);
      window.removeEventListener('click', stopFlashing);
    };

    window.addEventListener('focus', stopFlashing);
    window.addEventListener('click', stopFlashing);
  }

  function scrollToBottom() {
    agentMessageList.parentElement.scrollTop = agentMessageList.parentElement.scrollHeight;
  }
})();
