import React, { useState, useRef, useEffect } from 'react';
import { Edit, Eye, Plus, Trash2, Save, Upload, Lock, Unlock, X } from 'lucide-react';

const GRID_SIZE = 120;
const TILE_SIZE = 100;

// Password for edit mode - change this to your desired password
const EDIT_PASSWORD = 'changeme123';

// Initial sample data
const initialData = {
  characters: [
    {
      id: '1',
      name: 'Wei Wuxian',
      pronunciation: 'Way Woo-shyen',
      titles: ['Yiling Patriarch'],
      nicknames: ['Wei Ying'],
      gridX: 1,
      gridY: 1,
      image: '',
      symbols: ['⚔️', '🌙'],
      statusSymbol: '💀',
      bio: 'Brilliant cultivator who created demonic cultivation'
    },
    {
      id: '2',
      name: 'Lan Wangji',
      pronunciation: 'Lan Wong-jee',
      titles: ['Hanguang-Jun'],
      nicknames: ['Lan Zhan'],
      gridX: 3,
      gridY: 1,
      image: '',
      symbols: ['🎵', '❄️'],
      statusSymbol: '',
      bio: 'Righteous cultivator of the Lan Clan'
    }
  ],
  connections: [
    {
      id: 'c1',
      from: '1',
      to: '2',
      type: 'love',
      startSide: 'right',
      endSide: 'left',
      waypoints: []
    }
  ],
  legend: {
    lines: {
      love: { color: '#ff1493', style: 'solid', thickness: 3, label: 'Love' },
      family: { color: '#ff0000', style: 'solid', thickness: 2, label: 'Family' },
      rivalry: { color: '#ff8c00', style: 'dashed', thickness: 2, label: 'Rivalry' },
      friendship: { color: '#00ff00', style: 'solid', thickness: 2, label: 'Friendship' },
      mentor: { color: '#9370db', style: 'solid', thickness: 2, label: 'Mentor/Student' }
    },
    symbols: {
      '💀': 'Deceased',
      '👻': 'Ghost',
      '🧟': 'Undead',
      '⚔️': 'Warrior',
      '🎵': 'Musician',
      '🌙': 'Demonic Cultivation',
      '❄️': 'Ice/Cold Affinity',
      '🔥': 'Fire Affinity',
      '💚': 'Healer',
      '👑': 'Royalty'
    }
  }
};

const AuthModal = ({ onAuthenticate, onClose }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (password === EDIT_PASSWORD) {
      onAuthenticate();
      onClose();
    } else {
      setError('Incorrect password');
      setPassword('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Lock size={20} /> Enter Password
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <div>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            className="w-full p-3 bg-gray-700 text-white rounded mb-2"
            placeholder="Enter edit password"
            autoFocus
          />
          {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
          <button
            onClick={handleSubmit}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition"
          >
            Unlock Edit Mode
          </button>
        </div>
        <p className="text-gray-400 text-xs mt-3">
          Edit mode is password protected to prevent unauthorized changes.
        </p>
      </div>
    </div>
  );
};

const CharacterTile = ({ character, onClick, isEditing, onDragStart, connections, allCharacters }) => {
  return (
    <div
      className={`absolute ${isEditing ? 'cursor-move' : 'cursor-pointer'} transition-transform hover:scale-105`}
      style={{
        left: character.gridX * GRID_SIZE,
        top: character.gridY * GRID_SIZE,
        width: TILE_SIZE,
        height: TILE_SIZE
      }}
      onClick={onClick}
      draggable={isEditing}
      onDragStart={onDragStart}
    >
      <div className="relative w-full h-full border-2 border-gray-700 rounded-lg overflow-hidden bg-gray-800 shadow-lg">
        {character.image ? (
          <img src={character.image} alt={character.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white text-4xl">
            ?
          </div>
        )}
        
        {character.statusSymbol && (
          <div className="absolute top-1 right-1 text-3xl opacity-90">
            {character.statusSymbol}
          </div>
        )}
        
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-80 text-white p-1 text-center">
          <div className="text-xs font-bold truncate">{character.name}</div>
          {character.titles?.[0] && (
            <div className="text-xs text-gray-300 truncate">{character.titles[0]}</div>
          )}
        </div>
        
        {character.symbols && character.symbols.length > 0 && (
          <div className="absolute top-1 left-1 flex gap-0.5 flex-wrap max-w-[60%]">
            {character.symbols.slice(0, 4).map((symbol, i) => (
              <span key={i} className="text-sm">{symbol}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ConnectionLine = ({ connection, characters, legend, isEditing, onWaypointDrag, onAddWaypoint, onDeleteWaypoint, selectedConnection }) => {
  const fromChar = characters.find(c => c.id === connection.from);
  const toChar = characters.find(c => c.id === connection.to);
  
  if (!fromChar || !toChar) return null;
  
  const lineStyle = legend.lines[connection.type] || { color: '#ffffff', style: 'solid', thickness: 2 };
  
  const getConnectionPoint = (char, side) => {
    const baseX = char.gridX * GRID_SIZE + TILE_SIZE / 2;
    const baseY = char.gridY * GRID_SIZE + TILE_SIZE / 2;
    
    switch(side) {
      case 'top': return { x: baseX, y: char.gridY * GRID_SIZE };
      case 'bottom': return { x: baseX, y: char.gridY * GRID_SIZE + TILE_SIZE };
      case 'left': return { x: char.gridX * GRID_SIZE, y: baseY };
      case 'right': return { x: char.gridX * GRID_SIZE + TILE_SIZE, y: baseY };
      default: return { x: baseX, y: baseY };
    }
  };
  
  const start = getConnectionPoint(fromChar, connection.startSide || 'right');
  const end = getConnectionPoint(toChar, connection.endSide || 'left');
  
  const waypoints = connection.waypoints || [];
  const allPoints = [start, ...waypoints, end];
  
  const pathD = allPoints.map((point, i) => 
    i === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`
  ).join(' ');
  
  const strokeDasharray = lineStyle.style === 'dashed' ? '8,4' : lineStyle.style === 'dotted' ? '2,4' : 'none';
  
  const midIndex = Math.floor(allPoints.length / 2);
  const labelPoint = allPoints[midIndex];
  
  const isSelected = selectedConnection === connection.id;
  
  return (
    <g>
      <path
        d={pathD}
        stroke={lineStyle.color}
        strokeWidth={lineStyle.thickness}
        strokeDasharray={strokeDasharray}
        fill="none"
      />
      <circle cx={start.x} cy={start.y} r="4" fill={lineStyle.color} />
      
      {isEditing && isSelected && waypoints.map((wp, i) => (
        <g key={i}>
          <circle
            cx={wp.x}
            cy={wp.y}
            r="6"
            fill={lineStyle.color}
            stroke="white"
            strokeWidth="2"
            className="cursor-move"
            onMouseDown={(e) => {
              e.stopPropagation();
              onWaypointDrag(connection.id, i, e);
            }}
          />
          <circle
            cx={wp.x + 12}
            cy={wp.y - 12}
            r="8"
            fill="red"
            className="cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteWaypoint(connection.id, i);
            }}
          />
          <text
            x={wp.x + 12}
            y={wp.y - 9}
            fill="white"
            fontSize="10"
            textAnchor="middle"
            className="pointer-events-none"
          >
            ×
          </text>
        </g>
      ))}
      
      {isEditing && isSelected && allPoints.slice(0, -1).map((point, i) => {
        const nextPoint = allPoints[i + 1];
        const midX = (point.x + nextPoint.x) / 2;
        const midY = (point.y + nextPoint.y) / 2;
        return (
          <circle
            key={`add-${i}`}
            cx={midX}
            cy={midY}
            r="5"
            fill="green"
            stroke="white"
            strokeWidth="1"
            className="cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onAddWaypoint(connection.id, i, midX, midY);
            }}
          />
        );
      })}
      
      <text
        x={labelPoint.x}
        y={labelPoint.y - 8}
        fill={lineStyle.color}
        fontSize="10"
        textAnchor="middle"
        className="font-semibold pointer-events-none"
      >
        {fromChar.name} → {toChar.name}
      </text>
    </g>
  );
};

const CharacterModal = ({ character, legend, onClose, connections, allCharacters }) => {
  const characterConnections = connections.filter(c => c.from === character.id || c.to === character.id);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-start gap-4 mb-4">
          {character.image && (
            <img src={character.image} alt={character.name} className="w-24 h-24 object-cover rounded" />
          )}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-1">{character.name}</h2>
            {character.pronunciation && (
              <p className="text-gray-400 text-sm mb-2">({character.pronunciation})</p>
            )}
          </div>
        </div>
        
        {character.titles && character.titles.length > 0 && (
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-gray-300 mb-1">Titles:</h3>
            <div className="flex flex-wrap gap-1">
              {character.titles.map((title, i) => (
                <span key={i} className="bg-purple-600 text-white text-xs px-2 py-1 rounded">{title}</span>
              ))}
            </div>
          </div>
        )}
        
        {character.nicknames && character.nicknames.length > 0 && (
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-gray-300 mb-1">Nicknames:</h3>
            <div className="flex flex-wrap gap-1">
              {character.nicknames.map((nick, i) => (
                <span key={i} className="bg-blue-600 text-white text-xs px-2 py-1 rounded">{nick}</span>
              ))}
            </div>
          </div>
        )}
        
        {character.bio && (
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-gray-300 mb-1">Bio:</h3>
            <p className="text-white text-sm">{character.bio}</p>
          </div>
        )}
        
        {character.symbols && character.symbols.length > 0 && (
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-gray-300 mb-1">Symbols:</h3>
            <div className="space-y-1">
              {character.symbols.map((symbol, i) => (
                <div key={i} className="text-white text-sm flex items-center gap-2">
                  <span className="text-lg">{symbol}</span>
                  <span>{legend.symbols[symbol] || 'Unknown'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {character.statusSymbol && (
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-gray-300 mb-1">Status:</h3>
            <div className="text-white text-sm flex items-center gap-2">
              <span className="text-2xl">{character.statusSymbol}</span>
              <span>{legend.symbols[character.statusSymbol] || 'Unknown'}</span>
            </div>
          </div>
        )}
        
        {characterConnections.length > 0 && (
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-gray-300 mb-1">Connections:</h3>
            <div className="space-y-1">
              {characterConnections.map((conn, i) => {
                const otherChar = allCharacters.find(c => c.id === (conn.from === character.id ? conn.to : conn.from));
                const lineStyle = legend.lines[conn.type];
                return (
                  <div key={i} className="text-white text-sm flex items-center gap-2">
                    <div 
                      className="w-12 h-0.5" 
                      style={{ 
                        backgroundColor: lineStyle?.color || '#fff',
                        borderStyle: lineStyle?.style === 'dashed' ? 'dashed' : 'solid',
                        borderWidth: lineStyle?.style === 'dashed' ? '1px 0 0 0' : '0'
                      }}
                    />
                    <span>{lineStyle?.label || conn.type}</span>
                    <span className="text-gray-400">with</span>
                    <span>{otherChar?.name || 'Unknown'}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        <button
          onClick={onClose}
          className="w-full mt-4 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded transition"
        >
          Close
        </button>
      </div>
    </div>
  );
};

const EditPanel = ({ data, setData, selectedCharacter, setSelectedCharacter, selectedConnection, setSelectedConnection }) => {
  const [activeTab, setActiveTab] = useState('characters');
  
  const addCharacter = () => {
    const newChar = {
      id: Date.now().toString(),
      name: 'New Character',
      pronunciation: '',
      titles: [],
      nicknames: [],
      gridX: 0,
      gridY: 0,
      image: '',
      symbols: [],
      statusSymbol: '',
      bio: ''
    };
    setData({ ...data, characters: [...data.characters, newChar] });
  };
  
  const updateCharacter = (id: string, updates: Partial<Character>) => {
    setData(prev => ({
      ...prev,
      characters: prev.characters.map(c => (c.id === id ? { ...c, ...updates } : c)),
    }));
  };
  
  const deleteCharacter = (id) => {
    setData({
      ...data,
      characters: data.characters.filter(c => c.id !== id),
      connections: data.connections.filter(c => c.from !== id && c.to !== id)
    });
    setSelectedCharacter(null);
  };
  
  const addConnection = () => {
    const newConn = {
      id: Date.now().toString(),
      from: data.characters[0]?.id || '',
      to: data.characters[1]?.id || '',
      type: Object.keys(data.legend.lines)[0] || 'friendship',
      startSide: 'right',
      endSide: 'left',
      waypoints: []
    };
    setData({ ...data, connections: [...data.connections, newConn] });
  };
  
  const updateConnection = (id, updates) => {
    setData({
      ...data,
      connections: data.connections.map(c => c.id === id ? { ...c, ...updates } : c)
    });
  };
  
  const deleteConnection = (id) => {
    setData({
      ...data,
      connections: data.connections.filter(c => c.id !== id)
    });
    setSelectedConnection(null);
  };
  
  const updateLegend = (category, key, updates) => {
    const newLegend = { ...data.legend };
    if (updates === null) {
      delete newLegend[category][key];
    } else {
      newLegend[category][key] = { ...newLegend[category][key], ...updates };
    }
    setData({ ...data, legend: newLegend });
  };
  
  return (
    <div className="bg-gray-900 text-white p-4 overflow-y-auto" style={{ height: '100vh' }}>
      <h2 className="text-xl font-bold mb-4">Editor</h2>
      
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('characters')}
          className={`px-3 py-1 rounded text-sm ${activeTab === 'characters' ? 'bg-blue-600' : 'bg-gray-700'}`}
        >
          Characters
        </button>
        <button
          onClick={() => setActiveTab('connections')}
          className={`px-3 py-1 rounded text-sm ${activeTab === 'connections' ? 'bg-blue-600' : 'bg-gray-700'}`}
        >
          Connections
        </button>
        <button
          onClick={() => setActiveTab('legend')}
          className={`px-3 py-1 rounded text-sm ${activeTab === 'legend' ? 'bg-blue-600' : 'bg-gray-700'}`}
        >
          Legend
        </button>
      </div>
      
      {activeTab === 'characters' && (
        <div>
          <button onClick={addCharacter} className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded mb-3 flex items-center gap-2 text-sm">
            <Plus size={16} /> Add Character
          </button>
          
          <div className="space-y-2">
            {data.characters.map(char => (
              <div
                key={char.id}
                className={`p-3 rounded cursor-pointer ${selectedCharacter?.id === char.id ? 'bg-blue-600' : 'bg-gray-800'} hover:bg-gray-700`}
                onClick={() => setSelectedCharacter(char)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{char.name}</div>
                    <div className="text-xs text-gray-400">Grid: ({char.gridX}, {char.gridY})</div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteCharacter(char.id); }}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {selectedCharacter && (
            <div className="mt-4 p-3 bg-gray-800 rounded">
              <h3 className="font-semibold mb-3 text-sm">Edit Character</h3>
              
              <label className="block mb-2 text-xs">
                Name:
                <input
                  type="text"
                  value={selectedCharacter.name}
                  onChange={e => updateCharacter(selectedCharacter.id, { name: e.target.value })}
                  className="w-full mt-1 p-2 bg-gray-700 rounded text-sm"
                />
              </label>
              
              <label className="block mb-2 text-xs">
                Pronunciation:
                <input
                  type="text"
                  value={selectedCharacter.pronunciation || ''}
                  onChange={e => updateCharacter(selectedCharacter.id, { pronunciation: e.target.value })}
                  className="w-full mt-1 p-2 bg-gray-700 rounded text-sm"
                />
              </label>
              
              <label className="block mb-2 text-xs">
                Titles (comma-separated):
                <input
                  type="text"
                  value={selectedCharacter.titles?.join(', ') || ''}
                  onChange={e => updateCharacter(selectedCharacter.id, { titles: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                  className="w-full mt-1 p-2 bg-gray-700 rounded text-sm"
                />
              </label>
              
              <label className="block mb-2 text-xs">
                Nicknames (comma-separated):
                <input
                  type="text"
                  value={selectedCharacter.nicknames?.join(', ') || ''}
                  onChange={e => updateCharacter(selectedCharacter.id, { nicknames: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                  className="w-full mt-1 p-2 bg-gray-700 rounded text-sm"
                />
              </label>
              
              <label className="block mb-2 text-xs">
                Bio:
                <textarea
                  value={selectedCharacter.bio || ''}
                  onChange={e => updateCharacter(selectedCharacter.id, { bio: e.target.value })}
                  className="w-full mt-1 p-2 bg-gray-700 rounded text-sm"
                  rows="3"
                />
              </label>
              
              <label className="block mb-2 text-xs">
                Symbols (comma-separated emojis):
                <input
                  type="text"
                  value={selectedCharacter.symbols?.join(', ') || ''}
                  onChange={e => updateCharacter(selectedCharacter.id, { symbols: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                  className="w-full mt-1 p-2 bg-gray-700 rounded text-sm"
                />
              </label>
              
              <label className="block mb-2 text-xs">
                Status Symbol:
                <input
                  type="text"
                  value={selectedCharacter.statusSymbol || ''}
                  onChange={e => updateCharacter(selectedCharacter.id, { statusSymbol: e.target.value })}
                  className="w-full mt-1 p-2 bg-gray-700 rounded text-sm"
                  placeholder="e.g., 💀"
                />
              </label>
              
              <label className="block mb-2 text-xs">
                Image URL:
                <input
                  type="text"
                  value={selectedCharacter.image || ''}
                  onChange={e => updateCharacter(selectedCharacter.id, { image: e.target.value })}
                  className="w-full mt-1 p-2 bg-gray-700 rounded text-sm"
                  placeholder="https://..."
                />
              </label>
              
              <div className="grid grid-cols-2 gap-2 mt-2">
                <label className="block text-xs">
                  Grid X:
                  <input
                    type="number"
                    value={selectedCharacter.gridX}
                    onChange={e => updateCharacter(selectedCharacter.id, { gridX: parseInt(e.target.value) || 0 })}
                    className="w-full mt-1 p-2 bg-gray-700 rounded text-sm"
                  />
                </label>
                
                <label className="block text-xs">
                  Grid Y:
                  <input
                    type="number"
                    value={selectedCharacter.gridY}
                    onChange={e => updateCharacter(selectedCharacter.id, { gridY: parseInt(e.target.value) || 0 })}
                    className="w-full mt-1 p-2 bg-gray-700 rounded text-sm"
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'connections' && (
        <div>
          <button onClick={addConnection} className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded mb-3 flex items-center gap-2 text-sm">
            <Plus size={16} /> Add Connection
          </button>
          
          <div className="space-y-2">
            {data.connections.map(conn => {
              const fromChar = data.characters.find(c => c.id === conn.from);
              const toChar = data.characters.find(c => c.id === conn.to);
              return (
                <div 
                  key={conn.id} 
                  className={`p-3 rounded cursor-pointer ${selectedConnection === conn.id ? 'bg-blue-600' : 'bg-gray-800'} hover:bg-gray-700`}
                  onClick={() => setSelectedConnection(conn.id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-xs">
                      {fromChar?.name || 'Unknown'} → {toChar?.name || 'Unknown'}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteConnection(conn.id); }}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block text-xs">
                      From:
                      <select
                        value={conn.from}
                        onChange={e => updateConnection(conn.id, { from: e.target.value })}
                        className="w-full mt-1 p-1 bg-gray-700 rounded text-xs"
                        onClick={e => e.stopPropagation()}
                      >
                        {data.characters.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </label>
                    
                    <label className="block text-xs">
                      To:
                      <select
                        value={conn.to}
                        onChange={e => updateConnection(conn.id, { to: e.target.value })}
                        className="w-full mt-1 p-1 bg-gray-700 rounded text-xs"
                        onClick={e => e.stopPropagation()}
                      >
                        {data.characters.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  
                  <label className="block mt-2 text-xs">
                    Type:
                    <select
                      value={conn.type}
                      onChange={e => updateConnection(conn.id, { type: e.target.value })}
                      className="w-full mt-1 p-1 bg-gray-700 rounded text-xs"
                      onClick={e => e.stopPropagation()}
                    >
                      {Object.entries(data.legend.lines).map(([key, val]) => (
                        <option key={key} value={key}>{val.label}</option>
                      ))}
                    </select>
                  </label>
                  
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <label className="block text-xs">
                      Start Side:
                      <select
                        value={conn.startSide}
                        onChange={e => updateConnection(conn.id, { startSide: e.target.value })}
                        className="w-full mt-1 p-1 bg-gray-700 rounded text-xs"
                        onClick={e => e.stopPropagation()}
                      >
                        <option value="top">Top</option>
                        <option value="bottom">Bottom</option>
                        <option value="left">Left</option>
                        <option value="right">Right</option>
                      </select>
                    </label>
                    
                    <label className="block text-xs">
                      End Side:
                      <select
                        value={conn.endSide}
                        onChange={e => updateConnection(conn.id, { endSide: e.target.value })}
                        className="w-full mt-1 p-1 bg-gray-700 rounded text-xs"
                        onClick={e => e.stopPropagation()}
                      >
                        <option value="top">Top</option>
                        <option value="bottom">Bottom</option>
                        <option value="left">Left</option>
                        <option value="right">Right</option>
                      </select>
                    </label>
                  </div>
                  
                  {selectedConnection === conn.id && (
                    <div className="mt-2 text-xs text-gray-400">
                      💡 Click on the canvas to add waypoints to bend this line
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {activeTab === 'legend' && (
        <div>
          <h3 className="font-semibold mb-2 text-sm">Line Styles</h3>
          <div className="space-y-2 mb-4">
            {Object.entries(data.legend.lines).map(([key, style]) => (
              <div key={key} className="p-3 bg-gray-800 rounded">
                <div className="flex justify-between items-start mb-2">
                  <input
                    type="text"
                    value={style.label}
                    onChange={e => updateLegend('lines', key, { label: e.target.value })}
                    className="bg-gray-700 px-2 py-1 rounded text-xs flex-1 mr-2"
                  />
                  <button
                    onClick={() => updateLegend('lines', key, null)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <label className="block">
                    Color:
                    <input
                      type="color"
                      value={style.color}
                      onChange={e => updateLegend('lines', key, { color: e.target.value })}
                      className="w-full mt-1 h-8 bg-gray-700 rounded"
                    />
                  </label>
                  
                  <label className="block">
                    Style:
                    <select
                      value={style.style}
                      onChange={e => updateLegend('lines', key, { style: e.target.value })}
                      className="w-full mt-1 p-1 bg-gray-700 rounded"
                    >
                      <option value="solid">Solid</option>
                      <option value="dashed">Dashed</option>
                      <option value="dotted">Dotted</option>
                    </select>
                  </label>
                  
                  <label className="block">
                    Width:
                    <input
                      type="number"
                      value={style.thickness}
                      onChange={e => updateLegend('lines', key, { thickness: parseInt(e.target.value) || 1 })}
                      className="w-full mt-1 p-1 bg-gray-700 rounded"
                      min="1"
                      max="10"
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
          
          <h3 className="font-semibold mb-2 mt-4 text-sm">Symbol Meanings</h3>
          <div className="space-y-2">
            {Object.entries(data.legend.symbols).map(([symbol, meaning]) => (
              <div key={symbol} className="p-2 bg-gray-800 rounded flex items-center gap-2">
                <span className="text-xl">{symbol}</span>
                <input
                  type="text"
                  value={meaning}
                  onChange={e => updateLegend('symbols', symbol, e.target.value)}
                  className="flex-1 bg-gray-700 px-2 py-1 rounded text-xs"
                />
                <button
                  onClick={() => updateLegend('symbols', symbol, null)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-4 p-3 bg-gray-800 rounded space-y-2">
        <button
          onClick={() => {
            const dataStr = JSON.stringify(data, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'character-map-data.json';
            a.click();
          }}
          className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded flex items-center justify-center gap-2 text-sm"
        >
          <Save size={16} /> Export Data
        </button>
        
        <label className="w-full bg-green-600 hover:bg-green-700 py-2 rounded flex items-center justify-center gap-2 cursor-pointer text-sm">
          <Upload size={16} /> Import Data
          <input
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                  try {
                    const imported = JSON.parse(event.target.result);
                    setData(imported);
                  } catch (err) {
                    alert('Error importing file');
                  }
                };
                reader.readAsText(file);
              }
            }}
          />
        </label>
      </div>
    </div>
  );
};

const Legend = ({ legend }) => {
  return (
    <div className="bg-gray-900 bg-opacity-90 p-4 rounded-lg max-h-[80vh] overflow-y-auto">
      <h3 className="text-white font-bold mb-3 text-lg">Legend</h3>
      
      <div className="mb-4">
        <h4 className="text-white font-semibold mb-2 text-sm">Relationships</h4>
        <div className="space-y-2">
          {Object.entries(legend.lines).map(([key, style]) => (
            <div key={key} className="flex items-center gap-2 text-white text-sm">
              <div
                className="w-12 h-0"
                style={{
                  borderTop: `${style.thickness}px ${style.style} ${style.color}`
                }}
              />
              <span>{style.label}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <h4 className="text-white font-semibold mb-2 text-sm">Symbols</h4>
        <div className="space-y-1">
          {Object.entries(legend.symbols).map(([symbol, meaning]) => (
            <div key={symbol} className="flex items-center gap-2 text-white text-sm">
              <span className="text-lg">{symbol}</span>
              <span>{meaning}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function CharacterMapper() {
  const [data, setData] = useState(initialData);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [modalCharacter, setModalCharacter] = useState(null);
  const [showLegend, setShowLegend] = useState(true);
  const [draggingWaypoint, setDraggingWaypoint] = useState(null);
  const canvasRef = useRef(null);
  
  const handleDragStart = (e, character) => {
    if (!isEditing) return;
    e.dataTransfer.setData('characterId', character.id);
  };
  
  const handleDrop = (e) => {
    if (!isEditing) return;
    e.preventDefault();
    const characterId = e.dataTransfer.getData('characterId');
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const gridX = Math.round(x / GRID_SIZE);
    const gridY = Math.round(y / GRID_SIZE);
    
    setData({
      ...data,
      characters: data.characters.map(c =>
        c.id === characterId ? { ...c, gridX, gridY } : c
      )
    });
  };
  
  const handleDragOver = (e) => {
    if (isEditing) e.preventDefault();
  };
  
  const handleWaypointDrag = (connId, wpIndex, e) => {
    e.preventDefault();
    setDraggingWaypoint({ connId, wpIndex });
  };
  
  const handleMouseMove = (e) => {
    if (!draggingWaypoint || !isEditing) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setData({
      ...data,
      connections: data.connections.map(conn => {
        if (conn.id === draggingWaypoint.connId) {
          const newWaypoints = [...conn.waypoints];
          newWaypoints[draggingWaypoint.wpIndex] = { x, y };
          return { ...conn, waypoints: newWaypoints };
        }
        return conn;
      })
    });
  };
  
  const handleMouseUp = () => {
    setDraggingWaypoint(null);
  };
  
  const handleAddWaypoint = (connId, segmentIndex, x, y) => {
    setData({
      ...data,
      connections: data.connections.map(conn => {
        if (conn.id === connId) {
          const newWaypoints = [...conn.waypoints];
          newWaypoints.splice(segmentIndex, 0, { x, y });
          return { ...conn, waypoints: newWaypoints };
        }
        return conn;
      })
    });
  };
  
  const handleDeleteWaypoint = (connId, wpIndex) => {
    setData({
      ...data,
      connections: data.connections.map(conn => {
        if (conn.id === connId) {
          const newWaypoints = conn.waypoints.filter((_, i) => i !== wpIndex);
          return { ...conn, waypoints: newWaypoints };
        }
        return conn;
      })
    });
  };
  
  const handleEditClick = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
    } else {
      setIsEditing(!isEditing);
    }
  };
  
  const maxX = Math.max(...data.characters.map(c => c.gridX), 5);
  const maxY = Math.max(...data.characters.map(c => c.gridY), 5);
  
  useEffect(() => {
    if (draggingWaypoint) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingWaypoint]);
  
  return (
    <div className="min-h-screen bg-gray-950 flex">
      {isEditing && isAuthenticated && (
        <div className="w-80 border-r border-gray-700">
          <EditPanel
            data={data}
            setData={setData}
            selectedCharacter={selectedCharacter}
            setSelectedCharacter={setSelectedCharacter}
            selectedConnection={selectedConnection}
            setSelectedConnection={setSelectedConnection}
          />
        </div>
      )}
      
      <div className="flex-1 relative">
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <button
            onClick={() => setShowLegend(!showLegend)}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition flex items-center gap-2 text-sm"
          >
            {showLegend ? 'Hide' : 'Show'} Legend
          </button>
          <button
            onClick={handleEditClick}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 text-sm"
          >
            {isEditing ? <><Eye size={18} /> View Mode</> : <><Edit size={18} /> Edit Mode</>}
          </button>
        </div>
        
        {showLegend && (
          <div className="absolute top-4 left-4 z-10">
            <Legend legend={data.legend} />
          </div>
        )}
        
        <div className="overflow-auto h-screen p-8">
          <div
            ref={canvasRef}
            className="relative bg-gray-900"
            style={{
              width: (maxX + 3) * GRID_SIZE,
              height: (maxY + 3) * GRID_SIZE,
              backgroundImage: isEditing ? `
                linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
              ` : 'none',
              backgroundSize: isEditing ? `${GRID_SIZE}px ${GRID_SIZE}px` : 'auto'
            }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <g className="pointer-events-auto">
                {data.connections.map(conn => (
                  <ConnectionLine
                    key={conn.id}
                    connection={conn}
                    characters={data.characters}
                    legend={data.legend}
                    isEditing={isEditing}
                    onWaypointDrag={handleWaypointDrag}
                    onAddWaypoint={handleAddWaypoint}
                    onDeleteWaypoint={handleDeleteWaypoint}
                    selectedConnection={selectedConnection}
                  />
                ))}
              </g>
            </svg>
            
            {data.characters.map(char => (
              <CharacterTile
                key={char.id}
                character={char}
                onClick={() => !isEditing && setModalCharacter(char)}
                isEditing={isEditing}
                onDragStart={(e) => handleDragStart(e, char)}
                connections={data.connections}
                allCharacters={data.characters}
              />
            ))}
          </div>
        </div>
      </div>
      
      {modalCharacter && (
        <CharacterModal
          character={modalCharacter}
          legend={data.legend}
          onClose={() => setModalCharacter(null)}
          connections={data.connections}
          allCharacters={data.characters}
        />
      )}
      
      {showAuthModal && (
        <AuthModal
          onAuthenticate={() => {
            setIsAuthenticated(true);
            setIsEditing(true);
          }}
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </div>
  );
}