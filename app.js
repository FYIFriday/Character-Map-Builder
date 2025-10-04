const { useState, useRef, useEffect } = React;
const { Edit, Eye, Plus, Trash2, Save, Upload, Lock, Unlock, X } = lucide;

const GRID_SIZE = 120;
const TILE_SIZE = 100;
const EDIT_PASSWORD = 'changeme123'; // CHANGE THIS PASSWORD!

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

function AuthModal({ onAuthenticate, onClose }) {
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

  return React.createElement('div', {
    className: 'fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4',
    onClick: onClose
  },
    React.createElement('div', {
      className: 'bg-gray-800 rounded-lg p-6 max-w-sm w-full',
      onClick: e => e.stopPropagation()
    },
      React.createElement('div', { className: 'flex items-center justify-between mb-4' },
        React.createElement('h2', { className: 'text-xl font-bold text-white flex items-center gap-2' },
          React.createElement(Lock, { size: 20 }),
          ' Enter Password'
        ),
        React.createElement('button', {
          onClick: onClose,
          className: 'text-gray-400 hover:text-white'
        }, React.createElement(X, { size: 20 }))
      ),
      React.createElement('div', null,
        React.createElement('input', {
          type: 'password',
          value: password,
          onChange: e => setPassword(e.target.value),
          onKeyDown: e => e.key === 'Enter' && handleSubmit(),
          className: 'w-full p-3 bg-gray-700 text-white rounded mb-2',
          placeholder: 'Enter edit password',
          autoFocus: true
        }),
        error && React.createElement('p', { className: 'text-red-400 text-sm mb-2' }, error),
        React.createElement('button', {
          onClick: handleSubmit,
          className: 'w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition'
        }, 'Unlock Edit Mode')
      ),
      React.createElement('p', { className: 'text-gray-400 text-xs mt-3' },
        'Edit mode is password protected to prevent unauthorized changes.'
      )
    )
  );
}

function CharacterTile({ character, onClick, isEditing, onDragStart }) {
  return React.createElement('div', {
    className: `absolute ${isEditing ? 'cursor-move' : 'cursor-pointer'} transition-transform hover:scale-105`,
    style: {
      left: character.gridX * GRID_SIZE,
      top: character.gridY * GRID_SIZE,
      width: TILE_SIZE,
      height: TILE_SIZE
    },
    onClick,
    draggable: isEditing,
    onDragStart
  },
    React.createElement('div', {
      className: 'relative w-full h-full border-2 border-gray-700 rounded-lg overflow-hidden bg-gray-800 shadow-lg'
    },
      character.image ?
        React.createElement('img', {
          src: character.image,
          alt: character.name,
          className: 'w-full h-full object-cover'
        }) :
        React.createElement('div', {
          className: 'w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white text-4xl'
        }, '?'),
      character.statusSymbol && React.createElement('div', {
        className: 'absolute top-1 right-1 text-3xl opacity-90'
      }, character.statusSymbol),
      React.createElement('div', {
        className: 'absolute bottom-0 left-0 right-0 bg-black bg-opacity-80 text-white p-1 text-center'
      },
        React.createElement('div', { className: 'text-xs font-bold truncate' }, character.name),
        character.titles?.[0] && React.createElement('div', {
          className: 'text-xs text-gray-300 truncate'
        }, character.titles[0])
      ),
      character.symbols && character.symbols.length > 0 && React.createElement('div', {
        className: 'absolute top-1 left-1 flex gap-0.5 flex-wrap max-w-[60%]'
      }, character.symbols.slice(0, 4).map((symbol, i) =>
        React.createElement('span', { key: i, className: 'text-sm' }, symbol)
      ))
    )
  );
}

function ConnectionLine({ connection, characters, legend, isEditing, onWaypointDrag, onAddWaypoint, onDeleteWaypoint, selectedConnection }) {
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
  
  return React.createElement('g', null,
    React.createElement('path', {
      d: pathD,
      stroke: lineStyle.color,
      strokeWidth: lineStyle.thickness,
      strokeDasharray,
      fill: 'none'
    }),
    React.createElement('circle', {
      cx: start.x,
      cy: start.y,
      r: 4,
      fill: lineStyle.color
    }),
    isEditing && isSelected && waypoints.map((wp, i) =>
      React.createElement('g', { key: i },
        React.createElement('circle', {
          cx: wp.x,
          cy: wp.y,
          r: 6,
          fill: lineStyle.color,
          stroke: 'white',
          strokeWidth: 2,
          className: 'cursor-move',
          onMouseDown: (e) => {
            e.stopPropagation();
            onWaypointDrag(connection.id, i, e);
          }
        }),
        React.createElement('circle', {
          cx: wp.x + 12,
          cy: wp.y - 12,
          r: 8,
          fill: 'red',
          className: 'cursor-pointer',
          onClick: (e) => {
            e.stopPropagation();
            onDeleteWaypoint(connection.id, i);
          }
        }),
        React.createElement('text', {
          x: wp.x + 12,
          y: wp.y - 9,
          fill: 'white',
          fontSize: 10,
          textAnchor: 'middle',
          className: 'pointer-events-none'
        }, '×')
      )
    ),
    isEditing && isSelected && allPoints.slice(0, -1).map((point, i) => {
      const nextPoint = allPoints[i + 1];
      const midX = (point.x + nextPoint.x) / 2;
      const midY = (point.y + nextPoint.y) / 2;
      return React.createElement('circle', {
        key: `add-${i}`,
        cx: midX,
        cy: midY,
        r: 5,
        fill: 'green',
        stroke: 'white',
        strokeWidth: 1,
        className: 'cursor-pointer',
        onClick: (e) => {
          e.stopPropagation();
          onAddWaypoint(connection.id, i, midX, midY);
        }
      });
    }),
    React.createElement('text', {
      x: labelPoint.x,
      y: labelPoint.y - 8,
      fill: lineStyle.color,
      fontSize: 10,
      textAnchor: 'middle',
      className: 'font-semibold pointer-events-none'
    }, `${fromChar.name} → ${toChar.name}`)
  );
}

function CharacterModal({ character, legend, onClose, connections, allCharacters }) {
  const characterConnections = connections.filter(c => c.from === character.id || c.to === character.id);
  
  return React.createElement('div', {
    className: 'fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4',
    onClick: onClose
  },
    React.createElement('div', {
      className: 'bg-gray-800 rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto',
      onClick: e => e.stopPropagation()
    },
      React.createElement('div', { className: 'flex items-start gap-4 mb-4' },
        character.image && React.createElement('img', {
          src: character.image,
          alt: character.name,
          className: 'w-24 h-24 object-cover rounded'
        }),
        React.createElement('div', { className: 'flex-1' },
          React.createElement('h2', { className: 'text-2xl font-bold text-white mb-1' }, character.name),
          character.pronunciation && React.createElement('p', {
            className: 'text-gray-400 text-sm mb-2'
          }, `(${character.pronunciation})`)
        )
      ),
      character.titles && character.titles.length > 0 && React.createElement('div', { className: 'mb-3' },
        React.createElement('h3', { className: 'text-sm font-semibold text-gray-300 mb-1' }, 'Titles:'),
        React.createElement('div', { className: 'flex flex-wrap gap-1' },
          character.titles.map((title, i) =>
            React.createElement('span', {
              key: i,
              className: 'bg-purple-600 text-white text-xs px-2 py-1 rounded'
            }, title)
          )
        )
      ),
      character.nicknames && character.nicknames.length > 0 && React.createElement('div', { className: 'mb-3' },
        React.createElement('h3', { className: 'text-sm font-semibold text-gray-300 mb-1' }, 'Nicknames:'),
        React.createElement('div', { className: 'flex flex-wrap gap-1' },
          character.nicknames.map((nick, i) =>
            React.createElement('span', {
              key: i,
              className: 'bg-blue-600 text-white text-xs px-2 py-1 rounded'
            }, nick)
          )
        )
      ),
      character.bio && React.createElement('div', { className: 'mb-3' },
        React.createElement('h3', { className: 'text-sm font-semibold text-gray-300 mb-1' }, 'Bio:'),
        React.createElement('p', { className: 'text-white text-sm' }, character.bio)
      ),
      character.symbols && character.symbols.length > 0 && React.createElement('div', { className: 'mb-3' },
        React.createElement('h3', { className: 'text-sm font-semibold text-gray-300 mb-1' }, 'Symbols:'),
        React.createElement('div', { className: 'space-y-1' },
          character.symbols.map((symbol, i) =>
            React.createElement('div', {
              key: i,
              className: 'text-white text-sm flex items-center gap-2'
            },
              React.createElement('span', { className: 'text-lg' }, symbol),
              React.createElement('span', null, legend.symbols[symbol] || 'Unknown')
            )
          )
        )
      ),
      character.statusSymbol && React.createElement('div', { className: 'mb-3' },
        React.createElement('h3', { className: 'text-sm font-semibold text-gray-300 mb-1' }, 'Status:'),
        React.createElement('div', { className: 'text-white text-sm flex items-center gap-2' },
          React.createElement('span', { className: 'text-2xl' }, character.statusSymbol),
          React.createElement('span', null, legend.symbols[character.statusSymbol] || 'Unknown')
        )
      ),
      characterConnections.length > 0 && React.createElement('div', { className: 'mb-3' },
        React.createElement('h3', { className: 'text-sm font-semibold text-gray-300 mb-1' }, 'Connections:'),
        React.createElement('div', { className: 'space-y-1' },
          characterConnections.map((conn, i) => {
            const otherChar = allCharacters.find(c => c.id === (conn.from === character.id ? conn.to : conn.from));
            const lineStyle = legend.lines[conn.type];
            return React.createElement('div', {
              key: i,
              className: 'text-white text-sm flex items-center gap-2'
            },
              React.createElement('div', {
                className: 'w-12 h-0.5',
                style: {
                  backgroundColor: lineStyle?.color || '#fff',
                  borderStyle: lineStyle?.style === 'dashed' ? 'dashed' : 'solid',
                  borderWidth: lineStyle?.style === 'dashed' ? '1px 0 0 0' : '0'
                }
              }),
              React.createElement('span', null, lineStyle?.label || conn.type),
              React.createElement('span', { className: 'text-gray-400' }, 'with'),
              React.createElement('span', null, otherChar?.name || 'Unknown')
            );
          })
        )
      ),
      React.createElement('button', {
        onClick: onClose,
        className: 'w-full mt-4 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded transition'
      }, 'Close')
    )
  );
}

function Legend({ legend }) {
  return React.createElement('div', {
    className: 'bg-gray-900 bg-opacity-90 p-4 rounded-lg max-h-[80vh] overflow-y-auto'
  },
    React.createElement('h3', { className: 'text-white font-bold mb-3 text-lg' }, 'Legend'),
    React.createElement('div', { className: 'mb-4' },
      React.createElement('h4', { className: 'text-white font-semibold mb-2 text-sm' }, 'Relationships'),
      React.createElement('div', { className: 'space-y-2' },
        Object.entries(legend.lines).map(([key, style]) =>
          React.createElement('div', {
            key,
            className: 'flex items-center gap-2 text-white text-sm'
          },
            React.createElement('div', {
              className: 'w-12 h-0',
              style: {
                borderTop: `${style.thickness}px ${style.style} ${style.color}`
              }
            }),
            React.createElement('span', null, style.label)
          )
        )
      )
    ),
    React.createElement('div', null,
      React.createElement('h4', { className: 'text-white font-semibold mb-2 text-sm' }, 'Symbols'),
      React.createElement('div', { className: 'space-y-1' },
        Object.entries(legend.symbols).map(([symbol, meaning]) =>
          React.createElement('div', {
            key: symbol,
            className: 'flex items-center gap-2 text-white text-sm'
          },
            React.createElement('span', { className: 'text-lg' }, symbol),
            React.createElement('span', null, meaning)
          )
        )
      )
    )
  );
}

// EditPanel component - simplified version shown here
function EditPanel({ data, setData, selectedCharacter, setSelectedCharacter, selectedConnection, setSelectedConnection }) {
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
  
  const updateCharacter = (id, updates) => {
    setData({
      ...data,
      characters: data.characters.map(c => c.id === id ? { ...c, ...updates } : c)
    });
  };
  
  const deleteCharacter = (id) => {
    setData({
      ...data,
      characters: data.characters.filter(c => c.id !== id),
      connections: data.connections.filter(c => c.from !== id && c.to !== id)
    });
    setSelectedCharacter(null);
  };
  
  const exportData = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'character-map-data.json';
    a.click();
  };
  
  const importData = (file) => {
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
  };
  
  // Render tabs and edit interface
  return React.createElement('div', {
    className: 'bg-gray-900 text-white p-4 overflow-y-auto',
    style: { height: '100vh' }
  },
    React.createElement('h2', { className: 'text-xl font-bold mb-4' }, 'Editor'),
    React.createElement('div', { className: 'flex gap-2 mb-4' },
      ['characters', 'connections', 'legend'].map(tab =>
        React.createElement('button', {
          key: tab,
          onClick: () => setActiveTab(tab),
          className: `px-3 py-1 rounded text-sm ${activeTab === tab ? 'bg-blue-600' : 'bg-gray-700'}`
        }, tab.charAt(0).toUpperCase() + tab.slice(1))
      )
    ),
    React.createElement('button', {
      onClick: exportData,
      className: 'w-full bg-blue-600 hover:bg-blue-700 py-2 rounded mb-2 flex items-center justify-center gap-2'
    },
      React.createElement(Save, { size: 16 }),
      'Export Data'
    ),
    React.createElement('label', {
      className: 'w-full bg-green-600 hover:bg-green-700 py-2 rounded flex items-center justify-center gap-2 cursor-pointer'
    },
      React.createElement(Upload, { size: 16 }),
      'Import Data',
      React.createElement('input', {
        type: 'file',
        accept: '.json',
        className: 'hidden',
        onChange: (e) => importData(e.target.files[0])
      })
    )
  );
}

function CharacterMapper() {
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
  
  const handleEditClick = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
    } else {
      setIsEditing(!isEditing);
    }
  };
  
  const maxX = Math.max(...data.characters.map(c => c.gridX), 5);
  const maxY = Math.max(...data.characters.map(c => c.gridY), 5);
  
  return React.createElement('div', { className: 'min-h-screen bg-gray-950 flex' },
    isEditing && isAuthenticated && React.createElement('div', {
      className: 'w-80 border-r border-gray-700'
    }, React.createElement(EditPanel, {
      data,
      setData,
      selectedCharacter,
      setSelectedCharacter,
      selectedConnection,
      setSelectedConnection
    })),
    React.createElement('div', { className: 'flex-1 relative' },
      React.createElement('div', { className: 'absolute top-4 right-4 z-10 flex gap-2' },
        React.createElement('button', {
          onClick: () => setShowLegend(!showLegend),
          className: 'bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition flex items-center gap-2 text-sm'
        }, showLegend ? 'Hide' : 'Show', ' Legend'),
        React.createElement('button', {
          onClick: handleEditClick,
          className: 'bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 text-sm'
        },
          isEditing ? React.createElement(Eye, { size: 18 }) : React.createElement(Edit, { size: 18 }),
          isEditing ? ' View Mode' : ' Edit Mode'
        )
      ),
      showLegend && React.createElement('div', {
        className: 'absolute top-4 left-4 z-10'
      }, React.createElement(Legend, { legend: data.legend })),
      React.createElement('div', { className: 'overflow-auto h-screen p-8' },
        React.createElement('div', {
          ref: canvasRef,
          className: 'relative bg-gray-900',
          style: {
            width: (maxX + 3) * GRID_SIZE,
            height: (maxY + 3) * GRID_SIZE,
            backgroundImage: isEditing ? 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)' : 'none',
            backgroundSize: isEditing ? `${GRID_SIZE}px ${GRID_SIZE}px` : 'auto'
          }
        },
          React.createElement('svg', {
            className: 'absolute inset-0 w-full h-full pointer-events-none'
          },
            React.createElement('g', { className: 'pointer-events-auto' },
              data.connections.map(conn =>
                React.createElement(ConnectionLine, {
                  key: conn.id,
                  connection: conn,
                  characters: data.characters,
                  legend: data.legend,
                  isEditing,
                  selectedConnection
                })
              )
            )
          ),
          data.characters.map(char =>
            React.createElement(CharacterTile, {
              key: char.id,
              character: char,
              onClick: () => !isEditing && setModalCharacter(char),
              isEditing
            })
          )
        )
      )
    ),
    modalCharacter && React.createElement(CharacterModal, {
      character: modalCharacter,
      legend: data.legend,
      onClose: () => setModalCharacter(null),
      connections: data.connections,
      allCharacters: data.characters
    }),
    showAuthModal && React.createElement(AuthModal, {
      onAuthenticate: () => {
        setIsAuthenticated(true);
        setIsEditing(true);
      },
      onClose: () => setShowAuthModal(false)
    })
  );
}

// Initialize the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(CharacterMapper));