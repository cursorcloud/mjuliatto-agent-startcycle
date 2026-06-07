(function() {
  let socket = null;
  let sessionId = sessionStorage.getItem('chat_session_id') || null;
  let customerName = sessionStorage.getItem('chat_name') || null;
  let customerEmail = sessionStorage.getItem('chat_email') || null;
  let chatStatus = 'queue'; // queue, active, closed
  let isTyping = false;
  let typingTimeout = null;
  let unreadMessagesCount = 0;

  // DOM Elements
  const chatWidget = document.getElementById('chatWidget');
  const chatToggleBtn = document.getElementById('chatToggleBtn');
  const unreadBadge = document.getElementById('unreadBadge');
  const chatWindow = document.getElementById('chatWindow');
  const chatHeaderClose = document.getElementById('chatHeaderClose');
  const chatTitle = document.getElementById('chatTitle');
  const chatSubtitle = document.getElementById('chatSubtitle');
  const agentAvatarDot = document.getElementById('agentAvatarDot');
  
  const chatBodyOnboarding = document.getElementById('chatBodyOnboarding');
  const chatBodyConversation = document.getElementById('chatBodyConversation');
  const onboardingForm = document.getElementById('onboardingForm');
  const customerNameInput = document.getElementById('customerName');
  const customerEmailInput = document.getElementById('customerEmail');
  
  const messageList = document.getElementById('messageList');
  const typingIndicator = document.getElementById('typingIndicator');
  const chatFooter = document.getElementById('chatFooter');
  const chatMessageForm = document.getElementById('chatMessageForm');
  const messageInput = document.getElementById('messageInput');

  // Initialize
  init();

  function init() {
    // Check if we have an active session saved
    if (sessionId && customerName && customerEmail) {
      showConversationUI();
      connectWebSocket(customerName, customerEmail, sessionId);
    } else {
      showOnboardingUI();
    }

    // Event Listeners
    onboardingForm.addEventListener('submit', handleOnboardingSubmit);
    chatMessageForm.addEventListener('submit', handleSendMessage);
    messageInput.addEventListener('input', handleTypingInput);

    // Popover visibility tracking
    chatToggleBtn.addEventListener('click', () => {
      // Toggle popover state manually if needed or let popover API handle it.
      // Reset unread badge on open
      if (document.activeElement === chatToggleBtn || chatWindow.matches(':popover-open')) {
        clearUnreadBadge();
      }
    });

    // Close button inside header
    chatHeaderClose.addEventListener('click', () => {
      chatWindow.hidePopover();
    });

    // Scroll list to bottom when popover opens
    chatWindow.addEventListener('toggle', (event) => {
      if (event.newState === 'open') {
        clearUnreadBadge();
        scrollToBottom();
      }
    });
  }

  function showOnboardingUI() {
    chatBodyOnboarding.classList.remove('hidden');
    chatBodyConversation.classList.add('hidden');
    chatFooter.classList.add('hidden');
    agentAvatarDot.className = 'avatar-dot offline';
    chatTitle.textContent = 'Live Chat Support';
    chatSubtitle.textContent = 'Typically replies in minutes';
  }

  function showConversationUI() {
    chatBodyOnboarding.classList.add('hidden');
    chatBodyConversation.classList.remove('hidden');
    chatFooter.classList.remove('hidden');
  }

  function handleOnboardingSubmit(e) {
    e.preventDefault();

    // Custom Validation feedback trigger
    let isValid = true;
    
    if (!customerNameInput.checkValidity()) {
      document.getElementById('nameError').style.display = 'block';
      isValid = false;
    } else {
      document.getElementById('nameError').style.display = 'none';
    }

    if (!customerEmailInput.checkValidity()) {
      document.getElementById('emailError').style.display = 'block';
      isValid = false;
    } else {
      document.getElementById('emailError').style.display = 'none';
    }

    if (!isValid) return;

    customerName = customerNameInput.value.trim();
    customerEmail = customerEmailInput.value.trim();

    sessionStorage.setItem('chat_name', customerName);
    sessionStorage.setItem('chat_email', customerEmail);

    showConversationUI();
    connectWebSocket(customerName, customerEmail, null);
  }

  function connectWebSocket(name, email, existingSessionId) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    console.log(`Connecting to WebSocket at ${wsUrl}`);
    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('WebSocket connection opened');
      
      // Initialize customer session on server
      socket.send(JSON.stringify({
        type: 'customer_init',
        payload: {
          name: name,
          email: email,
          sessionId: existingSessionId
        }
      }));
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const { type, payload } = data;

        switch (type) {
          case 'session_ready': {
            sessionId = payload.sessionId;
            chatStatus = payload.status;
            sessionStorage.setItem('chat_session_id', sessionId);
            
            // Clean message list and load history
            messageList.innerHTML = '';
            payload.messages.forEach(msg => appendMessage(msg));
            
            updateAgentStatus(payload.agentName, chatStatus);
            scrollToBottom();
            break;
          }

          case 'claim_success': {
            chatStatus = payload.status;
            updateAgentStatus(payload.agentName, chatStatus);
            appendMessage(payload.message);
            scrollToBottom();
            break;
          }

          case 'msg': {
            // Verify message belongs to our session
            if (payload.sessionId === sessionId) {
              appendMessage(payload.message);
              scrollToBottom();

              // Increment unread count if widget is closed
              if (!chatWindow.matches(':popover-open')) {
                incrementUnreadBadge();
              }
            }
            break;
          }

          case 'typing': {
            if (payload.sessionId === sessionId && payload.sender === 'agent') {
              if (payload.isTyping) {
                typingIndicator.classList.remove('hidden');
                scrollToBottom();
              } else {
                typingIndicator.classList.add('hidden');
              }
            }
            break;
          }

          case 'session_closed': {
            chatStatus = payload.status;
            updateAgentStatus(null, chatStatus);
            appendMessage(payload.message);
            disableChatInput();
            scrollToBottom();
            break;
          }
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    socket.onclose = () => {
      console.log('WebSocket connection closed. Retrying in 3 seconds...');
      agentAvatarDot.className = 'avatar-dot offline';
      setTimeout(() => {
        if (chatStatus !== 'closed') {
          connectWebSocket(name, email, sessionId);
        }
      }, 3000);
    };
  }

  function appendMessage(msg) {
    // Avoid appending duplicates
    if (document.getElementById(`msg-${msg.id}`)) return;

    const bubble = document.createElement('div');
    bubble.id = `msg-${msg.id}`;
    bubble.className = `message-bubble ${msg.sender}`;
    
    // Convert text newlines to breaks
    const textSpan = document.createElement('span');
    textSpan.innerText = msg.text;
    bubble.appendChild(textSpan);

    // Metadata (Timestamp)
    const timeSpan = document.createElement('span');
    timeSpan.className = 'msg-meta';
    const time = new Date(msg.timestamp);
    timeSpan.innerText = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    bubble.appendChild(timeSpan);

    messageList.appendChild(bubble);
  }

  function handleSendMessage(e) {
    e.preventDefault();
    const text = messageInput.value.trim();
    if (!text || !socket || socket.readyState !== 1) return;

    // Send message via WebSocket
    socket.send(JSON.stringify({
      type: 'msg',
      payload: {
        sessionId: sessionId,
        text: text,
        sender: 'customer'
      }
    }));

    messageInput.value = '';
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
    if (isTyping === typingState || !socket || socket.readyState !== 1 || !sessionId) return;
    
    isTyping = typingState;
    socket.send(JSON.stringify({
      type: 'typing',
      payload: {
        sessionId: sessionId,
        isTyping: isTyping,
        sender: 'customer'
      }
    }));
  }

  function updateAgentStatus(agentName, status) {
    if (status === 'active' && agentName) {
      chatTitle.textContent = agentName;
      chatSubtitle.textContent = 'Support Specialist (Online)';
      agentAvatarDot.className = 'avatar-dot online';
    } else if (status === 'queue') {
      chatTitle.textContent = 'Live Chat Support';
      chatSubtitle.textContent = 'Connecting to agent...';
      agentAvatarDot.className = 'avatar-dot offline';
    } else if (status === 'closed') {
      chatTitle.textContent = 'Chat Finished';
      chatSubtitle.textContent = 'Session closed';
      agentAvatarDot.className = 'avatar-dot offline';
    }
  }

  function disableChatInput() {
    messageInput.disabled = true;
    messageInput.placeholder = 'Chat session closed.';
    chatMessageForm.querySelector('button').disabled = true;
  }

  function scrollToBottom() {
    messageList.scrollTop = messageList.scrollHeight;
  }

  function incrementUnreadBadge() {
    unreadMessagesCount++;
    unreadBadge.textContent = unreadMessagesCount;
    unreadBadge.classList.remove('hidden');
  }

  function clearUnreadBadge() {
    unreadMessagesCount = 0;
    unreadBadge.classList.add('hidden');
  }
})();
