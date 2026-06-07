const express = require('express');
const { WebSocketServer } = require('ws');
const http = require('http');
const path = require('path');
const crypto = require('crypto');

const app = express();
const port = process.env.PORT || 3000;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ noServer: true });

// Store chat sessions and agents in-memory
// sessions schema: { [sessionId]: { id, name, email, status, messages, agentId, agentName, customerSocket } }
const sessions = {};
// agents schema: { [agentId]: { id, name, socket } }
const agents = {};

// Helper to broadcast to all active agents
function broadcastToAgents(messageObj) {
  const data = JSON.stringify(messageObj);
  Object.values(agents).forEach(agent => {
    if (agent.socket && agent.socket.readyState === 1) { // OPEN
      agent.socket.send(data);
    }
  });
}

// Helper to get sanitized session data to send to agents
function getSessionsSummary() {
  const summary = {};
  Object.keys(sessions).forEach(id => {
    const s = sessions[id];
    summary[id] = {
      id: s.id,
      name: s.name,
      email: s.email,
      status: s.status,
      agentId: s.agentId,
      agentName: s.agentName,
      messages: s.messages,
      online: !!s.customerSocket
    };
  });
  return summary;
}

// Handle WebSocket upgrade manually to bind with HTTP server
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

wss.on('connection', (ws) => {
  let isAgent = false;
  let currentSessionId = null;
  let currentAgentId = null;

  console.log('New client connection initiated');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      const { type, payload } = data;

      switch (type) {
        case 'customer_init': {
          const { name, email, sessionId } = payload;
          currentSessionId = sessionId || crypto.randomUUID();
          isAgent = false;

          let isNewSession = false;

          if (sessions[currentSessionId]) {
            // Restore session
            console.log(`Customer session restored: ${currentSessionId} (${name})`);
            sessions[currentSessionId].customerSocket = ws;
            // Update details if they changed
            sessions[currentSessionId].name = name;
            sessions[currentSessionId].email = email;
          } else {
            // Create new session
            console.log(`New customer session: ${currentSessionId} (${name})`);
            isNewSession = true;
            sessions[currentSessionId] = {
              id: currentSessionId,
              name: name,
              email: email,
              status: 'queue', // queue, active, closed
              messages: [],
              agentId: null,
              agentName: null,
              customerSocket: ws
            };

            // Add automatic welcome message
            const welcomeMsg = {
              id: crypto.randomUUID(),
              sender: 'system',
              text: `Hello ${name}! Welcome to our support. An agent will be with you shortly.`,
              timestamp: new Date().toISOString()
            };
            sessions[currentSessionId].messages.push(welcomeMsg);
          }

          // Acknowledge connection and return session data & history
          ws.send(JSON.stringify({
            type: 'session_ready',
            payload: {
              sessionId: currentSessionId,
              status: sessions[currentSessionId].status,
              agentName: sessions[currentSessionId].agentName,
              messages: sessions[currentSessionId].messages
            }
          }));

          // Notify all agents about queue update or customer online status
          broadcastToAgents({
            type: 'sessions_update',
            payload: getSessionsSummary()
          });

          // If it's a new session, broadcast notification to agents
          if (isNewSession) {
            broadcastToAgents({
              type: 'new_queue_alert',
              payload: {
                name: name,
                email: email,
                sessionId: currentSessionId
              }
            });
          }
          break;
        }

        case 'agent_init': {
          const { agentId, name } = payload;
          currentAgentId = agentId || crypto.randomUUID();
          isAgent = true;

          console.log(`Agent registered: ${name} (${currentAgentId})`);

          agents[currentAgentId] = {
            id: currentAgentId,
            name: name,
            socket: ws
          };

          // Send current sessions snapshot to the agent
          ws.send(JSON.stringify({
            type: 'init_ok',
            payload: {
              agentId: currentAgentId,
              sessions: getSessionsSummary()
            }
          }));
          break;
        }

        case 'msg': {
          const { sessionId, text, sender } = payload;
          const session = sessions[sessionId];

          if (!session) {
            console.error(`Message sent to non-existent session: ${sessionId}`);
            return;
          }

          const messageObj = {
            id: crypto.randomUUID(),
            sender: sender, // customer, agent, system
            text: text,
            timestamp: new Date().toISOString()
          };

          session.messages.push(messageObj);
          console.log(`Message in session ${sessionId} from ${sender}: "${text}"`);

          const broadcastMsg = {
            type: 'msg',
            payload: {
              sessionId: sessionId,
              message: messageObj
            }
          };

          // Send to customer socket if connected
          if (session.customerSocket && session.customerSocket.readyState === 1) {
            session.customerSocket.send(JSON.stringify(broadcastMsg));
          }

          // Broadcast message update to all agents
          broadcastToAgents(broadcastMsg);
          break;
        }

        case 'typing': {
          const { sessionId, isTyping, sender } = payload;
          const session = sessions[sessionId];

          if (!session) return;

          const typingMsg = {
            type: 'typing',
            payload: {
              sessionId: sessionId,
              sender: sender,
              isTyping: isTyping
            }
          };

          if (sender === 'customer') {
            // Forward typing event to agents
            broadcastToAgents(typingMsg);
          } else if (sender === 'agent') {
            // Forward typing event to customer
            if (session.customerSocket && session.customerSocket.readyState === 1) {
              session.customerSocket.send(JSON.stringify(typingMsg));
            }
          }
          break;
        }

        case 'claim': {
          const { sessionId, agentId, agentName } = payload;
          const session = sessions[sessionId];

          if (!session) return;

          console.log(`Session ${sessionId} claimed by Agent ${agentName}`);

          session.status = 'active';
          session.agentId = agentId;
          session.agentName = agentName;

          const systemMsg = {
            id: crypto.randomUUID(),
            sender: 'system',
            text: `${agentName} has joined the chat.`,
            timestamp: new Date().toISOString()
          };
          session.messages.push(systemMsg);

          // Notify customer that chat has been claimed
          if (session.customerSocket && session.customerSocket.readyState === 1) {
            session.customerSocket.send(JSON.stringify({
              type: 'claim_success',
              payload: {
                agentName: agentName,
                status: 'active',
                message: systemMsg
              }
            }));
          }

          // Broadcast update to agents
          broadcastToAgents({
            type: 'sessions_update',
            payload: getSessionsSummary()
          });
          break;
        }

        case 'close': {
          const { sessionId } = payload;
          const session = sessions[sessionId];

          if (!session) return;

          console.log(`Session ${sessionId} closed`);
          session.status = 'closed';

          const systemMsg = {
            id: crypto.randomUUID(),
            sender: 'system',
            text: `This chat session has been closed. Thank you!`,
            timestamp: new Date().toISOString()
          };
          session.messages.push(systemMsg);

          // Notify customer
          if (session.customerSocket && session.customerSocket.readyState === 1) {
            session.customerSocket.send(JSON.stringify({
              type: 'session_closed',
              payload: {
                status: 'closed',
                message: systemMsg
              }
            }));
          }

          // Broadcast to agents
          broadcastToAgents({
            type: 'sessions_update',
            payload: getSessionsSummary()
          });
          break;
        }

        default:
          console.warn(`Unknown message type: ${type}`);
      }
    } catch (err) {
      console.error('Error handling WebSocket message:', err);
    }
  });

  ws.on('close', () => {
    if (isAgent) {
      console.log(`Agent connection closed: ${currentAgentId}`);
      if (currentAgentId && agents[currentAgentId]) {
        delete agents[currentAgentId];
      }
    } else {
      console.log(`Customer connection closed: ${currentSessionId}`);
      if (currentSessionId && sessions[currentSessionId]) {
        sessions[currentSessionId].customerSocket = null;
        // Broadcast customer offline state to agents
        broadcastToAgents({
          type: 'sessions_update',
          payload: getSessionsSummary()
        });
      }
    }
  });

  ws.on('error', (err) => {
    console.error('WebSocket connection error:', err);
  });
});

server.listen(port, () => {
  console.log(`Chat application server is running at http://localhost:${port}`);
});
