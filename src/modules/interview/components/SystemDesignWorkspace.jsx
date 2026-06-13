import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

const TOOLBOX_COMPONENTS = [
  { type: 'client', label: 'Client (User)', color: '#ffb3ba', bgSoft: '#ffe5ec' },
  { type: 'load_balancer', label: 'Load Balancer', color: 'var(--yellow)', bgSoft: '#fffdf0' },
  { type: 'api_gateway', label: 'API Gateway', color: 'var(--purple)', bgSoft: '#faf5ff' },
  { type: 'app_server', label: 'App Server', color: 'var(--cyan)', bgSoft: '#f0faff' },
  { type: 'redis_cache', label: 'Redis Cache', color: 'var(--pink)', bgSoft: '#fff5f7' },
  { type: 'sql_db', label: 'SQL Database', color: 'var(--green)', bgSoft: '#f2faf5' },
  { type: 'nosql_db', label: 'NoSQL Database', color: '#baffc9', bgSoft: '#e8f7ee' },
  { type: 'kafka_queue', label: 'Kafka Queue', color: '#ffdfba', bgSoft: '#fff6ec' },
  { type: 'cdn', label: 'CDN Edge', color: '#bae1ff', bgSoft: '#eef7ff' }
];

export default function SystemDesignWorkspace({ diagram, setDiagram }) {
  const [nodes, setNodes] = useState(diagram?.nodes || []);
  const [connections, setConnections] = useState(diagram?.connections || []);
  const [linkingNodeId, setLinkingNodeId] = useState(null);
  const [draggedNodeId, setDraggedNodeId] = useState(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const canvasRef = useRef(null);

  // Sync to parent state whenever local nodes/connections changes
  useEffect(() => {
    setDiagram({ nodes, connections });
  }, [nodes, connections, setDiagram]);

  const addNode = (comp) => {
    const canvas = canvasRef.current;
    const rect = canvas ? canvas.getBoundingClientRect() : { width: 500, height: 400 };
    const newNode = {
      id: `node-${Date.now()}`,
      type: comp.type,
      label: comp.label,
      color: comp.color,
      bgSoft: comp.bgSoft,
      x: rect.width / 2 - 60 + (Math.random() * 30 - 15),
      y: rect.height / 2 - 35 + (Math.random() * 30 - 15)
    };
    setNodes(prev => [...prev, newNode]);
  };

  const handleCanvasMouseDown = () => {
    // Cancel linking if user clicks on empty canvas
    setLinkingNodeId(null);
  };

  const handleNodeMouseDown = (e, nodeId) => {
    e.stopPropagation();
    if (linkingNodeId) {
      // Connect nodes
      if (linkingNodeId !== nodeId) {
        // Prevent duplicate connections
        const exists = connections.some(c => 
          (c.from === linkingNodeId && c.to === nodeId) ||
          (c.from === nodeId && c.to === linkingNodeId)
        );
        if (!exists) {
          setConnections(prev => [...prev, {
            id: `conn-${Date.now()}`,
            from: linkingNodeId,
            to: nodeId
          }]);
        }
      }
      setLinkingNodeId(null);
      return;
    }

    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    setDraggedNodeId(nodeId);
    dragOffsetRef.current = {
      x: e.clientX - node.x,
      y: e.clientY - node.y
    };
  };

  const handleMouseMove = (e) => {
    if (!draggedNodeId) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const canvasRect = canvas.getBoundingClientRect();
    let newX = e.clientX - dragOffsetRef.current.x;
    let newY = e.clientY - dragOffsetRef.current.y;

    // Bounds checking
    newX = Math.max(10, Math.min(canvasRect.width - 130, newX));
    newY = Math.max(10, Math.min(canvasRect.height - 80, newY));

    setNodes(prev => prev.map(n => n.id === draggedNodeId ? { ...n, x: newX, y: newY } : n));
  };

  const handleMouseUp = () => {
    setDraggedNodeId(null);
  };

  const deleteNode = (e, nodeId) => {
    e.stopPropagation();
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setConnections(prev => prev.filter(c => c.from !== nodeId && c.to !== nodeId));
    if (linkingNodeId === nodeId) setLinkingNodeId(null);
  };

  const deleteConnection = (connId) => {
    setConnections(prev => prev.filter(c => c.id !== connId));
  };

  const startLinking = (e, nodeId) => {
    e.stopPropagation();
    setLinkingNodeId(nodeId);
  };

  const renameNode = (nodeId, newName) => {
    if (!newName.trim()) return;
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, label: newName } : n));
  };

  const clearCanvas = () => {
    setNodes([]);
    setConnections([]);
    setLinkingNodeId(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '0.75rem' }}>
      {/* Toolbox panel */}
      <div style={{
        border: '3px solid var(--border)',
        background: 'var(--white)',
        boxShadow: 'var(--shadow-sm)',
        padding: '0.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.4rem',
        flexShrink: 0
      }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 800, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', opacity: 0.6 }}>
          Component Toolbox (Click to add to canvas)
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
          {TOOLBOX_COMPONENTS.map(comp => (
            <button
              key={comp.type}
              onClick={() => addNode(comp)}
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                padding: '0.25rem 0.5rem',
                border: '2px solid var(--border)',
                background: comp.color,
                color: '#000000',
                cursor: 'pointer',
                boxShadow: '1.5px 1.5px 0 var(--border)',
                transition: 'all 0.1s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translate(-0.5px, -0.5px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
            >
              + {comp.label}
            </button>
          ))}
          <button
            onClick={clearCanvas}
            disabled={nodes.length === 0}
            className="btn btn-sm btn-pink"
            style={{
              marginLeft: 'auto',
              fontSize: '0.68rem',
              padding: '0.25rem 0.5rem',
              cursor: 'pointer'
            }}
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Canvas workspace */}
      <div
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onMouseDown={handleCanvasMouseDown}
        style={{
          flex: 1,
          border: '3px solid var(--border)',
          background: 'var(--white)',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)',
          cursor: draggedNodeId ? 'grabbing' : 'default'
        }}
      >
        {/* Visual canvas grid background */}
        <div style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.08,
          backgroundImage: 'radial-gradient(var(--border) 1.5px, transparent 1.5px)',
          backgroundSize: '16px 16px',
          pointerEvents: 'none'
        }} />

        {/* SVG connection lines layer */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 2 L 8 5 L 0 8 z" fill="var(--border)" />
            </marker>
          </defs>
          {connections.map(conn => {
            const fromNode = nodes.find(n => n.id === conn.from);
            const toNode = nodes.find(n => n.id === conn.to);
            if (!fromNode || !toNode) return null;

            const x1 = fromNode.x + 60;
            const y1 = fromNode.y + 35;
            const x2 = toNode.x + 60;
            const y2 = toNode.y + 35;

            return (
              <g key={conn.id}>
                {/* Visual line with thick border style */}
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="var(--border)"
                  strokeWidth="3"
                  markerEnd="url(#arrow)"
                />
                <circle
                  cx={(x1 + x2) / 2}
                  cy={(y1 + y2) / 2}
                  r="7"
                  fill="var(--pink)"
                  stroke="var(--border)"
                  strokeWidth="1.5"
                  style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                  onClick={() => deleteConnection(conn.id)}
                  title="Remove Link"
                />
                <text
                  x={(x1 + x2) / 2}
                  y={(y1 + y2) / 2 + 2}
                  textAnchor="middle"
                  fill="#000"
                  fontSize="7"
                  fontWeight="900"
                  style={{ pointerEvents: 'none' }}
                >
                  ×
                </text>
              </g>
            );
          })}
        </svg>

        {/* Canvas instruction overlay */}
        {nodes.length === 0 && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#aaa',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.78rem',
            fontStyle: 'italic',
            pointerEvents: 'none'
          }}>
            Add components and drag them to model the architecture. Click "Link" to connect.
          </div>
        )}

        {/* Whiteboard nodes layer */}
        <div style={{ position: 'relative', width: '100%', height: '100%', zIndex: 2 }}>
          {nodes.map(node => {
            const isLinking = linkingNodeId === node.id;
            return (
              <div
                key={node.id}
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                style={{
                  position: 'absolute',
                  left: node.x,
                  top: node.y,
                  width: 120,
                  height: 70,
                  border: '3px solid var(--border)',
                  background: node.bgSoft,
                  boxShadow: '2.5px 2.5px 0 var(--border)',
                  cursor: draggedNodeId === node.id ? 'grabbing' : 'grab',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '0.3rem',
                  borderRadius: 4,
                  boxSizing: 'border-box',
                  overflow: 'hidden',
                  userSelect: 'none'
                }}
              >
                {/* Node Top bar / controller */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                  <span style={{
                    fontSize: '0.55rem',
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)',
                    padding: '0 0.2rem',
                    border: '1px solid var(--border)',
                    background: node.color,
                    color: '#000'
                  }}>
                    {node.type.toUpperCase()}
                  </span>
                  <button
                    onClick={(e) => deleteNode(e, node.id)}
                    style={{
                      width: 13,
                      height: 13,
                      border: '1.5px solid var(--border)',
                      background: 'var(--pink)',
                      color: '#000',
                      fontSize: '8px',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      padding: 0
                    }}
                    title="Delete"
                  >
                    ×
                  </button>
                </div>

                {/* Node Label Text (Editable) */}
                <input
                  type="text"
                  value={node.label}
                  onChange={(e) => renameNode(node.id, e.target.value)}
                  onMouseDown={(e) => e.stopPropagation()} // Prevent dragging node when typing
                  style={{
                    flex: 1,
                    minWidth: 0,
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text)',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    outline: 'none',
                    textAlign: 'center',
                    marginTop: '0.2rem'
                  }}
                />

                {/* Link activator button */}
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => startLinking(e, node.id)}
                  style={{
                    fontSize: '0.52rem',
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)',
                    padding: '0.05rem 0.25rem',
                    border: '1.5px solid var(--border)',
                    background: isLinking ? 'var(--pink)' : 'var(--white)',
                    color: '#000000',
                    cursor: 'pointer',
                    alignSelf: 'center',
                    marginTop: 'auto',
                    textTransform: 'uppercase'
                  }}
                >
                  {isLinking ? 'Linking...' : 'Link'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
