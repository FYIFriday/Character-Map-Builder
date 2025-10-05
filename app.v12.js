const { useState, useRef, useEffect } = React;

// Simple icon components using Unicode symbols
const Icon = ({ symbol, size = 16, className = '' }) =>
  React.createElement(
    'span',
    {
      className: `inline-block ${className}`,
      style: { fontSize: `${size}px`, lineHeight: 1 }
    },
    symbol
  );

const Edit = (props) => Icon({ symbol: '✏️', ...props });
const Eye = (props) => Icon({ symbol: '👁️', ...props });
const Plus = (props) => Icon({ symbol: '➕', ...props });
const Trash2 = (props) => Icon({ symbol: '🗑️', ...props });
const Save = (props) => Icon({ symbol: '💾', ...props });
const Upload = (props) => Icon({ symbol: '📤', ...props });
const Lock = (props) => Icon({ symbol: '🔒', ...props });
const X = (props) => Icon({ symbol: '✖️', ...props });
const CheckSquare = (props) => Icon({ symbol: '☑️', ...props });

const GRID_SIZE = 20;
const TILE_WIDTH = 100;
const TILE_HEIGHT = 160;
const EDIT_PASSWORD = 'changeme123';

const ANGLE_GUIDES = [0, 45, 90, 135, 180, 225, 270, 315];
const ANGLE_TOLERANCE_DEG = 6;
const HINT_LINE_LENGTH = 2000;

const initialData = {
  canvasWidth: 50,
  canvasHeight: 40,
  characters: [
    {
      id: '1',
      name: 'Wei Wuxian',
      pronunciation: 'Way Woo-shyen',
      titles: ['Yiling Patriarch'],
      nicknames: ['Wei Ying'],
      gridX: 10,
      gridY: 10,
      image: '',
      imagePosition: 'center',
      symbols: ['⚔️', '🌙'],
      statusSymbol: '💀',
      bio: 'Brilliant cultivator who created demonic cultivation',
      sect: 'yunmeng'
    },
    {
      id: '2',
      name: 'Lan Wangji',
      pronunciation: 'Lan Wong-jee',
      titles: ['Hanguang-Jun'],
      nicknames: ['Lan Zhan'],
      gridX: 25,
      gridY: 10,
      image: '',
      imagePosition: 'center',
      symbols: ['🎵', '❄️'],
      statusSymbol: '',
      bio: 'Righteous cultivator of the Lan Clan',
      sect: 'gusulan'
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
      '⚔️': 'Warrior',
      '🎵': 'Musician',
      '🌙': 'Demonic Cultivation',
      '❄️': 'Ice/Cold Affinity',
      '🔥': 'Fire Affinity',
      '💚': 'Healer',
      '👑': 'Royalty'
    },
    statusSymbols: {
      '💀': 'Deceased',
      '👻': 'Ghost',
      '🧟': 'Undead',
      '💤': 'Sleeping/Dormant',
      '🥀': 'Injured',
      '⚡': 'Powered Up'
    },
    sects: {
      gusulan: { name: 'Gusu Lan Clan', color: '#3b82f6' },
      yunmeng: { name: 'Yunmeng Jiang Clan', color: '#a855f7' },
      qinghe: { name: 'Qinghe Nie Clan', color: '#22c55e' },
      lanling: { name: 'Lanling Jin Clan', color: '#eab308' },
      qishan: { name: 'Qishan Wen Clan', color: '#ef4444' }
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

  return React.createElement(
    'div',
    {
      className:
        'fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4',
      onClick: onClose
    },
    React.createElement(
      'div',
      {
        className: 'bg-gray-800 rounded-lg p-6 max-w-sm w-full',
        onClick: (e) => e.stopPropagation()
      },
      React.createElement(
        'div',
        { className: 'flex items-center justify-between mb-4' },
        React.createElement(
          'h2',
          { className: 'text-xl font-bold text-white flex items-center gap-2' },
          React.createElement(Lock, { size: 20 }),
          ' Enter Password'
        ),
        React.createElement(
          'button',
          {
            onClick: onClose,
            className: 'text-gray-400 hover:text-white'
          },
          React.createElement(X, { size: 20 })
        )
      ),
      React.createElement(
        'div',
        null,
        React.createElement('input', {
          type: 'password',
          value: password,
          onChange: (e) => setPassword(e.target.value),
          onKeyDown: (e) => e.key === 'Enter' && handleSubmit(),
          className: 'w-full p-3 bg-gray-700 text-white rounded mb-2',
          placeholder: 'Enter edit password',
          autoFocus: true
        }),
        error &&
          React.createElement(
            'p',
            { className: 'text-red-400 text-sm mb-2' },
            error
          ),
        React.createElement(
          'button',
          {
            onClick: handleSubmit,
            className:
              'w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition'
          },
          'Unlock Edit Mode'
        )
      ),
      React.createElement(
        'p',
        { className: 'text-gray-400 text-xs mt-3' },
        'Edit mode is password protected to prevent unauthorized changes.'
      )
    )
  );
}

function CharacterTile({
  character,
  onClick,
  isEditing,
  onDragStart,
  isHighlighted,
  isDimmed,
  sectColor,
  isSelected
}) {
  const bannerHeight = 40;
  const imageHeight = TILE_HEIGHT - bannerHeight;

  const getObjectPosition = (position) => {
    const positions = {
      top: '50% 0%',
      center: '50% 50%',
      bottom: '50% 100%',
      'top-left': '0% 0%',
      'top-right': '100% 0%',
      'bottom-left': '0% 100%',
      'bottom-right': '100% 100%'
    };
    return positions[position] || '50% 50%';
  };

  return React.createElement(
    'div',
    {
      className: `absolute ${
        isEditing ? 'cursor-move' : 'cursor-pointer'
      } transition-all ${
        isHighlighted ? 'z-20 scale-110' : isDimmed ? 'opacity-30' : 'opacity-100'
      }`,
      style: {
        left: character.gridX * GRID_SIZE,
        top: character.gridY * GRID_SIZE,
        width: TILE_WIDTH,
        height: TILE_HEIGHT
      },
      onClick,
      draggable: isEditing,
      onDragStart
    },
    React.createElement(
      'div',
      {
        className: `relative w-full h-full border-2 ${
          isSelected
            ? 'border-blue-500 shadow-lg shadow-blue-500/50'
            : isHighlighted
            ? 'border-yellow-400 shadow-lg shadow-yellow-400/50'
            : 'border-gray-700'
        } rounded-lg overflow-hidden bg-gray-800 ${
          isSelected ? 'ring-4 ring-blue-500/50' : isHighlighted ? 'ring-4 ring-yellow-400/50' : ''
        }`
      },
      React.createElement(
        'div',
        {
          className: 'w-full',
          style: { height: `${imageHeight}px` }
        },
        character.image
          ? React.createElement('img', {
              src: character.image,
              alt: character.name,
              className: 'w-full h-full object-cover',
              style: {
                objectPosition: getObjectPosition(character.imagePosition || 'center')
              }
            })
          : React.createElement(
              'div',
              {
                className:
                  'w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white text-4xl'
              },
              '?'
            )
      ),
      character.statusSymbol &&
        React.createElement(
          'div',
          {
            className: 'absolute top-1 right-1 text-3xl opacity-90'
          },
          character.statusSymbol
        ),
      isSelected &&
        React.createElement(
          'div',
          {
            className: 'absolute top-1 left-1 bg-blue-500 rounded-full p-1'
          },
          React.createElement(CheckSquare, { size: 16 })
        ),
      React.createElement(
        'div',
        {
          className: 'absolute bottom-0 left-0 right-0 text-white text-center',
          style: {
            backgroundColor: sectColor || 'rgba(0, 0, 0, 0.8)',
            height: `${bannerHeight}px`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '4px'
          }
        },
        React.createElement(
          'div',
          { className: 'text-xs font-bold truncate leading-tight' },
          character.name
        ),
        character.titles?.[0] &&
          React.createElement(
            'div',
            {
              className: 'text-xs opacity-90 truncate leading-tight'
            },
            character.titles[0]
          )
      ),
      character.symbols &&
        character.symbols.length > 0 &&
        React.createElement(
          'div',
          {
            className: 'absolute top-1 left-1 flex gap-0.5 flex-wrap max-w-[60%]'
          },
          character.symbols.slice(0, 4).map((symbol, i) =>
            React.createElement('span', { key: i, className: 'text-sm' }, symbol)
          )
        )
    )
  );
}

function ConnectionLine({
  connection,
  characters,
  legend,
  isEditing,
  onWaypointDrag,
  onAddWaypoint,
  onDeleteWaypoint,
  selectedConnection,
  onLabelDragStart,
  onConnectionClick
}) {
  const fromChar = characters.find((c) => c.id === connection.from);
  const toChar = characters.find((c) => c.id === connection.to);

  if (!fromChar || !toChar) return null;

  const lineStyle =
    legend.lines[connection.type] || { color: '#ffffff', style: 'solid', thickness: 2 };

  const getConnectionPoint = (char, side) => {
    const baseX = char.gridX * GRID_SIZE + TILE_WIDTH / 2;
    const baseY = char.gridY * GRID_SIZE + TILE_HEIGHT / 2;
    switch (side) {
      case 'top':
        return { x: baseX, y: char.gridY * GRID_SIZE };
      case 'bottom':
        return { x: baseX, y: char.gridY * GRID_SIZE + TILE_HEIGHT };
      case 'left':
        return { x: char.gridX * GRID_SIZE, y: baseY };
      case 'right':
        return { x: char.gridX * GRID_SIZE + TILE_WIDTH, y: baseY };
      default:
        return { x: baseX, y: baseY };
    }
  };

  const start = getConnectionPoint(fromChar, connection.startSide || 'right');
  const end = getConnectionPoint(toChar, connection.endSide || 'left');
  const waypoints = connection.waypoints || [];
  const allPoints = [start, ...waypoints, end];

  const pathD = allPoints
    .map((point, i) => (i === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`))
    .join(' ');
  const strokeDasharray =
    lineStyle.style === 'dashed'
      ? '8,4'
      : lineStyle.style === 'dotted'
      ? '2,4'
      : 'none';
  const isSelected = selectedConnection === connection.id;

  const toDeg = (rad) => ((rad * 180) / Math.PI + 360) % 360;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const angleBetween = (a, b) => toDeg(Math.atan2(b.y - a.y, b.x - a.x));
  const circDiff = (a, b) => {
    const d = Math.abs(a - b) % 360;
    return d > 180 ? 360 - d : d;
  };
  const nearestGuide = (deg) =>
    ANGLE_GUIDES.reduce(
      (best, g) => {
        const diff = circDiff(deg, g);
        return diff < best.diff ? { guide: g, diff } : best;
      },
      { guide: 0, diff: 999 }
    );

  const renderAngleHints = () => {
    if (!isEditing || !isSelected) return null;
    const elems = [];
    for (let i = 0; i < allPoints.length - 1; i++) {
      const a = allPoints[i];
      const b = allPoints[i + 1];
      const segAngle = angleBetween(a, b);
      const { guide, diff } = nearestGuide(segAngle);
      if (diff <= ANGLE_TOLERANCE_DEG) {
        const midX = (a.x + b.x) / 2;
        const midY = (a.y + b.y) / 2;
        const ux = Math.cos(toRad(guide));
        const uy = Math.sin(toRad(guide));
        const x1 = midX - ux * HINT_LINE_LENGTH;
        const y1 = midY - uy * HINT_LINE_LENGTH;
        const x2 = midX + ux * HINT_LINE_LENGTH;
        const y2 = midY + uy * HINT_LINE_LENGTH;

        elems.push(
          React.createElement('line', {
            key: `hint-line-${connection.id}-${i}`,
            x1,
            y1,
            x2,
            y2,
            stroke: 'rgba(56,189,248,0.6)',
            strokeWidth: 1,
            strokeDasharray: '3,6',
            pointerEvents: 'none'
          })
        );

        elems.push(
          React.createElement(
            'g',
            { key: `hint-badge-${connection.id}-${i}`, pointerEvents: 'none' },
            React.createElement('rect', {
              x: midX + 8,
              y: midY - 10,
              width: 34,
              height: 16,
              rx: 3,
              fill: 'rgba(17,24,39,0.85)',
              stroke: 'rgba(56,189,248,0.6)',
              strokeWidth: 1
            }),
            React.createElement(
              'text',
              {
                x: midX + 25,
                y: midY + 2,
                fill: 'rgba(191,219,254,0.95)',
                fontSize: 10,
                textAnchor: 'middle'
              },
              `${guide}°`
            )
          )
        );
      }
    }
    return elems;
  };

  const labelText = `${fromChar.name} → ${toChar.name}`;
  const estimateTextWidth = (text) => Math.max(30, text.length * 4.5);
  const LABEL_HEIGHT = 12;
  const LABEL_PADDING_X = 3;
  const EDGE_OFFSET = 5;

  const pointOnSegment = (a, b, t) => ({
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t
  });
  const normalize = (vx, vy) => {
    const len = Math.hypot(vx, vy) || 1;
    return { x: vx / len, y: vy / len };
  };

  const defaultLabels = () => {
    const lastSeg = Math.max(0, allPoints.length - 2);
    return [
      { id: 'start', segmentIndex: 0, t: Math.min(0.1, 0.9), side: 'auto' },
      { id: 'end', segmentIndex: lastSeg, t: 0.9, side: 'auto' }
    ];
  };

  const labelsArray =
    (connection.labels && connection.labels.length && connection.labels) ||
    defaultLabels();

  const renderLabel = (label) => {
    const segIndex = Math.max(0, Math.min(allPoints.length - 2, label.segmentIndex || 0));
    const a = allPoints[segIndex];
    const b = allPoints[segIndex + 1];

    const base = pointOnSegment(a, b, Math.max(0, Math.min(1, label.t ?? 0.5)));
    const tangent = normalize(b.x - a.x, b.y - a.y);
    const normal = { x: -tangent.y, y: tangent.x };

    const textWidth = estimateTextWidth(labelText) + 2 * LABEL_PADDING_X;

    let cx = base.x;
    let cy = base.y;

    const yOffset = EDGE_OFFSET + LABEL_HEIGHT / 2;
    const xOffset = EDGE_OFFSET + textWidth / 2;

    switch (label.side || 'auto') {
      case 'top':
        cy = base.y - yOffset;
        break;
      case 'bottom':
        cy = base.y + yOffset;
        break;
      case 'left':
        cx = base.x - xOffset;
        break;
      case 'right':
        cx = base.x + xOffset;
        break;
      case 'auto':
      default:
        cx = base.x + normal.x * (EDGE_OFFSET + LABEL_HEIGHT / 2);
        cy = base.y + normal.y * (EDGE_OFFSET + LABEL_HEIGHT / 2);
        break;
    }

    const rectX = cx - textWidth / 2;
    const rectY = cy - LABEL_HEIGHT / 2;

    return React.createElement(
      'g',
      {
        key: `label-${label.id}`,
        className: `${isEditing ? 'cursor-move' : ''}`,
        onMouseDown: (e) => {
          if (!isEditing) return;
          e.stopPropagation();
          onLabelDragStart && onLabelDragStart(connection.id, label.id, e);
        },
        onClick: (e) => {
          if (!isEditing) return;
          e.stopPropagation();
          onConnectionClick && onConnectionClick(connection.id);
        }
      },
      React.createElement('rect', {
        x: rectX,
        y: rectY,
        width: textWidth,
        height: LABEL_HEIGHT,
        fill: 'rgba(0,0,0,0.8)',
        rx: 3
      }),
      React.createElement(
        'text',
        {
          x: cx,
          y: cy + 3,
          fill: lineStyle.color,
          fontSize: 8,
          textAnchor: 'middle',
          className: 'font-semibold pointer-events-none'
        },
        labelText
      )
    );
  };

  return React.createElement(
    'g',
    null,
    ...(renderAngleHints() || []),
    // Invisible wide hit target for easier clicking
    isEditing &&
      React.createElement('path', {
        d: pathD,
        stroke: 'transparent',
        strokeWidth: 20,
        fill: 'none',
        className: 'cursor-pointer',
        onClick: (e) => {
          e.stopPropagation();
          onConnectionClick && onConnectionClick(connection.id);
        }
      }),
      ...(lineStyle.style === 'double'
        ? [
            React.createElement('path', {
              key: 'dblOuter',
              d: pathD,
              stroke: lineStyle.color,
              strokeWidth: Math.max(2, (lineStyle.thickness || 2) * 2),
              fill: 'none',
              className: isEditing ? 'pointer-events-none' : ''
            }),
            React.createElement('path', {
              key: 'dblInner',
              d: pathD,
              stroke: '#111827', // canvas bg (tailwind gray-900)
              strokeWidth: Math.max(1, Math.round((lineStyle.thickness || 2) * 0.9)),
              fill: 'none',
              className: isEditing ? 'pointer-events-none' : ''
            })
          ]
        : [
            React.createElement('path', {
              key: 'single',
              d: pathD,
              stroke: lineStyle.color,
              strokeWidth: lineStyle.thickness,
              strokeDasharray,
              fill: 'none',
              className: isEditing ? 'pointer-events-none' : ''
            })
          ]
      ),
    React.createElement('circle', { cx: start.x, cy: start.y, r: 4, fill: lineStyle.color }),
    isEditing &&
      isSelected &&
      waypoints.map((wp, i) =>
        React.createElement(
          'g',
          { key: i },
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
          React.createElement(
            'text',
            {
              x: wp.x + 12,
              y: wp.y - 9,
              fill: 'white',
              fontSize: 10,
              textAnchor: 'middle',
              className: 'pointer-events-none'
            },
            '×'
          )
        )
      ),
    isEditing &&
      isSelected &&
      allPoints.slice(0, -1).map((point, i) => {
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
    ...(labelsArray || []).map((lbl) => renderLabel(lbl))
  );
}

function CharacterModal({
  character,
  legend,
  onClose,
  connections,
  allCharacters
}) {
  const characterConnections = connections.filter(
    (c) => c.from === character.id || c.to === character.id
  );

  return React.createElement(
    'div',
    {
      className:
        'fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4',
      onClick: onClose
    },
    React.createElement(
      'div',
      {
        className: 'bg-gray-800 rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto',
        onClick: (e) => e.stopPropagation()
      },
      React.createElement(
        'div',
        { className: 'flex items-start gap-4 mb-4' },
        character.image &&
          React.createElement('img', {
            src: character.image,
            alt: character.name,
            className: 'w-24 h-24 object-cover rounded'
          }),
        React.createElement(
          'div',
          { className: 'flex-1' },
          React.createElement(
            'h2',
            { className: 'text-2xl font-bold text-white mb-1' },
            character.name
          ),
          character.pronunciation &&
            React.createElement(
              'p',
              {
                className: 'text-gray-400 text-sm mb-2'
              },
              `(${character.pronunciation})`
            )
        )
      ),
      character.titles &&
        character.titles.length > 0 &&
        React.createElement(
          'div',
          { className: 'mb-3' },
          React.createElement(
            'h3',
            { className: 'text-sm font-semibold text-gray-300 mb-1' },
            'Titles:'
          ),
          React.createElement(
            'div',
            { className: 'flex flex-wrap gap-1' },
            character.titles.map((title, i) =>
              React.createElement(
                'span',
                {
                  key: i,
                  className: 'bg-purple-600 text-white text-xs px-2 py-1 rounded'
                },
                title
              )
            )
          )
        ),
      character.nicknames &&
        character.nicknames.length > 0 &&
        React.createElement(
          'div',
          { className: 'mb-3' },
          React.createElement(
            'h3',
            { className: 'text-sm font-semibold text-gray-300 mb-1' },
            'Nicknames:'
          ),
          React.createElement(
            'div',
            { className: 'flex flex-wrap gap-1' },
            character.nicknames.map((nick, i) =>
              React.createElement(
                'span',
                {
                  key: i,
                  className: 'bg-blue-600 text-white text-xs px-2 py-1 rounded'
                },
                nick
              )
            )
          )
        ),
      character.bio &&
        React.createElement(
          'div',
          { className: 'mb-3' },
          React.createElement(
            'h3',
            { className: 'text-sm font-semibold text-gray-300 mb-1' },
            'Bio:'
          ),
          React.createElement('p', { className: 'text-white text-sm' }, character.bio)
        ),
      character.sect &&
        legend.sects?.[character.sect] &&
        React.createElement(
          'div',
          { className: 'mb-3' },
          React.createElement(
            'h3',
            { className: 'text-sm font-semibold text-gray-300 mb-1' },
            'Sect/Faction:'
          ),
          React.createElement(
            'div',
            { className: 'flex items-center gap-2' },
            React.createElement('div', {
              className: 'w-4 h-4 rounded',
              style: { backgroundColor: legend.sects[character.sect].color }
            }),
            React.createElement(
              'span',
              { className: 'text-white text-sm' },
              legend.sects[character.sect].name
            )
          )
        ),
      character.symbols &&
        character.symbols.length > 0 &&
        React.createElement(
          'div',
          { className: 'mb-3' },
          React.createElement(
            'h3',
            { className: 'text-sm font-semibold text-gray-300 mb-1' },
            'Symbols:'
          ),
          React.createElement(
            'div',
            { className: 'space-y-1' },
            character.symbols.map((symbol, i) =>
              React.createElement(
                'div',
                {
                  key: i,
                  className: 'text-white text-sm flex items-center gap-2'
                },
                React.createElement('span', { className: 'text-lg' }, symbol),
                React.createElement('span', null, legend.symbols[symbol] || 'Unknown')
              )
            )
          )
        ),
      character.statusSymbol &&
        React.createElement(
          'div',
          { className: 'mb-3' },
          React.createElement(
            'h3',
            { className: 'text-sm font-semibold text-gray-300 mb-1' },
            'Status:'
          ),
          React.createElement(
            'div',
            { className: 'text-white text-sm flex items-center gap-2' },
            React.createElement('span', { className: 'text-2xl' }, character.statusSymbol),
            React.createElement(
              'span',
              null,
              legend.statusSymbols?.[character.statusSymbol] || 'Unknown'
            )
          )
        ),
      characterConnections.length > 0 &&
        React.createElement(
          'div',
          { className: 'mb-3' },
          React.createElement(
            'h3',
            { className: 'text-sm font-semibold text-gray-300 mb-1' },
            'Connections:'
          ),
          React.createElement(
            'div',
            { className: 'space-y-1' },
            characterConnections.map((conn, i) => {
              const otherChar = allCharacters.find(
                (c) => c.id === (conn.from === character.id ? conn.to : conn.from)
              );
              const lineStyle = legend.lines[conn.type];
              return React.createElement(
                'div',
                {
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
      React.createElement(
        'button',
        {
          onClick: onClose,
          className:
            'w-full mt-4 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded transition'
        },
        'Close'
      )
    )
  );
}

function Legend({ legend, isMinimized, onToggleMinimize }) {
  if (isMinimized) {
    return React.createElement(
      'div',
      {
        className:
          'bg-gray-900 bg-opacity-95 p-3 rounded-lg cursor-pointer hover:bg-opacity-100 transition shadow-lg',
        onClick: onToggleMinimize
      },
      React.createElement(
        'div',
        { className: 'flex items-center gap-2' },
        React.createElement('h3', { className: 'text-white font-bold text-sm' }, 'Legend'),
        React.createElement('span', { className: 'text-white text-xs' }, '▶')
      )
    );
  }

  return React.createElement(
    'div',
    {
      className:
        'bg-gray-900 bg-opacity-95 p-4 rounded-lg max-h-[90vh] overflow-y-auto shadow-lg',
      style: { minWidth: '250px', maxWidth: '300px' }
    },
    React.createElement(
      'div',
      {
        className:
          'flex items-center justify-between mb-3 cursor-pointer',
        onClick: onToggleMinimize
      },
      React.createElement('h3', { className: 'text-white font-bold text-lg' }, 'Legend'),
      React.createElement(
        'span',
        { className: 'text-white text-sm hover:text-gray-300' },
        '◀'
      )
    ),
    React.createElement(
      'div',
      { className: 'mb-4' },
      React.createElement(
        'h4',
        { className: 'text-white font-semibold mb-2 text-sm' },
        'Relationships'
      ),
      React.createElement(
        'div',
        { className: 'space-y-2' },
        Object.entries(legend.lines).map(([key, style]) =>
          React.createElement(
            'div',
            {
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
    React.createElement(
      'div',
      { className: 'mb-4' },
      React.createElement(
        'h4',
        { className: 'text-white font-semibold mb-2 text-sm' },
        'Trait Symbols'
      ),
      React.createElement(
        'div',
        { className: 'space-y-1' },
        Object.entries(legend.symbols).map(([symbol, meaning]) =>
          React.createElement(
            'div',
            {
              key: symbol,
              className: 'flex items-center gap-2 text-white text-sm'
            },
            React.createElement('span', { className: 'text-lg' }, symbol),
            React.createElement('span', null, meaning)
          )
        )
      )
    ),
    React.createElement(
      'div',
      { className: 'mb-4' },
      React.createElement(
        'h4',
        { className: 'text-white font-semibold mb-2 text-sm' },
        'Status Symbols'
      ),
      React.createElement(
        'div',
        { className: 'space-y-1' },
        Object.entries(legend.statusSymbols || {}).map(([symbol, meaning]) =>
          React.createElement(
            'div',
            {
              key: symbol,
              className: 'flex items-center gap-2 text-white text-sm'
            },
            React.createElement('span', { className: 'text-lg' }, symbol),
            React.createElement('span', null, meaning)
          )
        )
      )
    ),
    legend.sects &&
      Object.keys(legend.sects).length > 0 &&
      React.createElement(
        'div',
        null,
        React.createElement(
          'h4',
          { className: 'text-white font-semibold mb-2 text-sm' },
          'Sects/Factions'
        ),
        React.createElement(
          'div',
          { className: 'space-y-1' },
          Object.entries(legend.sects).map(([key, sect]) =>
            React.createElement(
              'div',
              {
                key,
                className: 'flex items-center gap-2 text-white text-sm'
              },
              React.createElement('div', {
                className: 'w-4 h-4 rounded',
                style: { backgroundColor: sect.color }
              }),
              React.createElement('span', null, sect.name)
            )
          )
        )
      )
  );
}

function EditPanel({
  data,
  setData,
  selectedCharacter,
  setSelectedCharacter,
  selectedConnection,
  setSelectedConnection,
  activeTab,
  setActiveTab,
  publishCfg,
  savePublishCfg,
  onPublish,
  selectedItems,
  setSelectedItems
}) {
  const [commitMsg, setCommitMsg] = useState('Update data.json from app');
  
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
      imagePosition: 'center',
      symbols: [],
      statusSymbol: '',
      bio: '',
      sect: ''
    };
    setData({ ...data, characters: [...data.characters, newChar] });
  };

  const updateCharacter = (id, updates) => {
    const newCharacters = data.characters.map((c) =>
      c.id === id ? { ...c, ...updates } : c
    );
    setData({
      ...data,
      characters: newCharacters
    });
    if (selectedCharacter && selectedCharacter.id === id) {
      setSelectedCharacter(newCharacters.find((c) => c.id === id));
    }
  };

  const deleteCharacter = (id) => {
    setData({
      ...data,
      characters: data.characters.filter((c) => c.id !== id),
      connections: data.connections.filter((c) => c.from !== id && c.to !== id)
    });
    setSelectedCharacter(null);
    setSelectedItems(selectedItems.filter((sid) => sid !== id));
  };

  const addConnection = () => {
    const newConn = {
      id: Date.now().toString(),
      from: data.characters[0]?.id || '',
      to: data.characters[1]?.id || '',
      type: Object.keys(data.legend.lines)[0] || 'friendship',
      startSide: 'right',
      endSide: 'left',
      waypoints: [],
      labels: [
        { id: 'start', segmentIndex: 0, t: 0.1, side: 'auto' },
        { id: 'end', segmentIndex: 0, t: 0.9, side: 'auto' }
      ]
    };
    setData({ ...data, connections: [...data.connections, newConn] });
  };

  const updateConnection = (id, updates) => {
    setData({
      ...data,
      connections: data.connections.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      )
    });
  };

  const deleteConnection = (id) => {
    setData({
      ...data,
      connections: data.connections.filter((c) => c.id !== id)
    });
    setSelectedConnection(null);
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
          if (!imported.canvasWidth) imported.canvasWidth = 50;
          if (!imported.canvasHeight) imported.canvasHeight = 40;
          if (!imported.legend.sects) imported.legend.sects = {};
          if (!imported.legend.statusSymbols) imported.legend.statusSymbols = {};
          imported.characters = imported.characters.map((char) => ({
            ...char,
            imagePosition: char.imagePosition || 'center'
          }));
          setData(imported);
        } catch (err) {
          alert('Error importing file');
        }
      };
      reader.readAsText(file);
    }
  };

    // === Legend editing helpers ===
    const updateTraitName = (symbol, newName) => {
        const newSymbols = { ...data.legend.symbols, [symbol]: newName };
        setData({ ...data, legend: { ...data.legend, symbols: newSymbols } });
      };
    
      const replaceTraitSymbolEverywhere = (oldSym, newSym) => {
        if (!newSym || oldSym === newSym) return;
        if (data.legend.symbols[newSym] !== undefined) {
          alert('That trait symbol already exists.');
          return;
        }
        const newSymbols = { ...data.legend.symbols };
        const name = newSymbols[oldSym];
        delete newSymbols[oldSym];
        newSymbols[newSym] = name;
    
        const updatedChars = data.characters.map((c) => ({
          ...c,
          symbols: (c.symbols || []).map((s) => (s === oldSym ? newSym : s))
        }));
    
        setData({
          ...data,
          characters: updatedChars,
          legend: { ...data.legend, symbols: newSymbols }
        });
      };
    
      const addTrait = () => {
        const candidates = ['⚡','⭐','✨','⚔️','🌙','❄️','🔥','💚','👑','📜','🗡️','🛡️'];
        const newSym = candidates.find((s) => data.legend.symbols[s] === undefined) || '◆';
        const newSymbols = { ...data.legend.symbols, [newSym]: 'New Trait' };
        setData({ ...data, legend: { ...data.legend, symbols: newSymbols } });
      };
    
      const deleteTrait = (sym) => {
        const newSymbols = { ...data.legend.symbols };
        delete newSymbols[sym];
        const updatedChars = data.characters.map((c) => ({
          ...c,
          symbols: (c.symbols || []).filter((s) => s !== sym)
        }));
        setData({ ...data, characters: updatedChars, legend: { ...data.legend, symbols: newSymbols } });
      };
    
      const updateStatusName = (symbol, newName) => {
        const newStatuses = { ...(data.legend.statusSymbols || {}), [symbol]: newName };
        setData({ ...data, legend: { ...data.legend, statusSymbols: newStatuses } });
      };
    
      const replaceStatusSymbolEverywhere = (oldSym, newSym) => {
        if (!newSym || oldSym === newSym) return;
        const existing = data.legend.statusSymbols || {};
        if (existing[newSym] !== undefined) {
          alert('That status symbol already exists.');
          return;
        }
        const newStatuses = { ...existing };
        const name = newStatuses[oldSym];
        delete newStatuses[oldSym];
        newStatuses[newSym] = name;
    
        const updatedChars = data.characters.map((c) => ({
          ...c,
          statusSymbol: c.statusSymbol === oldSym ? newSym : c.statusSymbol
        }));
    
        setData({
          ...data,
          characters: updatedChars,
          legend: { ...data.legend, statusSymbols: newStatuses }
        });
      };
    
      const addStatus = () => {
        const candidates = ['💀','👻','🧟','🥀','💤','⚡'];
        const existing = data.legend.statusSymbols || {};
        const newSym = candidates.find((s) => existing[s] === undefined) || '✖️';
        const newStatuses = { ...existing, [newSym]: 'New Status' };
        setData({ ...data, legend: { ...data.legend, statusSymbols: newStatuses } });
      };
    
      const deleteStatus = (sym) => {
        const existing = data.legend.statusSymbols || {};
        const newStatuses = { ...existing };
        delete newStatuses[sym];
    
        const updatedChars = data.characters.map((c) => ({
          ...c,
          statusSymbol: c.statusSymbol === sym ? '' : c.statusSymbol
        }));
    
        setData({
          ...data,
          characters: updatedChars,
          legend: { ...data.legend, statusSymbols: newStatuses }
        });
      };
    
      const updateSectField = (key, field, value) => {
        const sects = data.legend.sects || {};
        const newSects = { ...sects, [key]: { ...sects[key], [field]: value } };
        setData({ ...data, legend: { ...data.legend, sects: newSects } });
      };
    
      const addSect = () => {
        const sects = data.legend.sects || {};
        let i = 1;
        let newKey = `sect_${i}`;
        while (sects[newKey]) { i += 1; newKey = `sect_${i}`; }
        const newSects = { ...sects, [newKey]: { name: 'New Sect', color: '#888888' } };
        setData({ ...data, legend: { ...data.legend, sects: newSects } });
      };
    
      const deleteSect = (key) => {
        const sects = data.legend.sects || {};
        const newSects = { ...sects };
        delete newSects[key];
        const updatedChars = data.characters.map((c) => (c.sect === key ? { ...c, sect: '' } : c));
        setData({ ...data, characters: updatedChars, legend: { ...data.legend, sects: newSects } });
      };
    
      const updateLineField = (key, field, value) => {
        const lines = data.legend.lines || {};
        const newLines = { ...lines, [key]: { ...lines[key], [field]: value } };
        setData({ ...data, legend: { ...data.legend, lines: newLines } });
      };
    
      const addLineType = () => {
        const lines = data.legend.lines || {};
        let i = 1;
        let newKey = `line_${i}`;
        while (lines[newKey]) { i += 1; newKey = `line_${i}`; }
        const newLines = {
          ...lines,
          [newKey]: { color: '#ffffff', style: 'solid', thickness: 2, label: 'New Line' }
        };
        setData({ ...data, legend: { ...data.legend, lines: newLines } });
      };
    
      const deleteLineType = (key) => {
        const lines = data.legend.lines || {};
        const newLines = { ...lines };
        delete newLines[key];
        const fallbackKey = Object.keys(newLines)[0];
    
        let newConnections = data.connections;
        if (fallbackKey) {
          newConnections = data.connections.map((conn) =>
            conn.type === key ? { ...conn, type: fallbackKey } : conn
          );
        } else {
          // if you delete the last type, drop those connections
          newConnections = data.connections.filter((conn) => conn.type !== key);
        }
    
        setData({ ...data, connections: newConnections, legend: { ...data.legend, lines: newLines } });
      };

  const publishSection = React.createElement(
    'div',
    { className: 'mt-3 p-3 bg-blue-900 bg-opacity-20 border border-blue-700 rounded space-y-2' },
    React.createElement(
      'div',
      { className: 'text-sm font-semibold' },
      'Publish (Global): Update data.json on GitHub'
    ),
    React.createElement(
      'div',
      { className: 'grid grid-cols-2 gap-2 text-xs' },
      React.createElement(
        'label',
        { className: 'block' },
        'Owner:',
        React.createElement('input', {
          type: 'text',
          value: publishCfg.owner || '',
          onChange: (e) => savePublishCfg({ ...publishCfg, owner: e.target.value }),
          className: 'w-full mt-1 p-2 bg-gray-700 rounded'
        })
      ),
      React.createElement(
        'label',
        { className: 'block' },
        'Repo:',
        React.createElement('input', {
          type: 'text',
          value: publishCfg.repo || '',
          onChange: (e) => savePublishCfg({ ...publishCfg, repo: e.target.value }),
          className: 'w-full mt-1 p-2 bg-gray-700 rounded'
        })
      ),
      React.createElement(
        'label',
        { className: 'block' },
        'Branch:',
        React.createElement('input', {
          type: 'text',
          value: publishCfg.branch || 'main',
          onChange: (e) => savePublishCfg({ ...publishCfg, branch: e.target.value }),
          className: 'w-full mt-1 p-2 bg-gray-700 rounded',
          placeholder: 'main'
        })
      ),
      React.createElement(
        'label',
        { className: 'block' },
        'Path:',
        React.createElement('input', {
          type: 'text',
          value: publishCfg.path || 'data.json',
          onChange: (e) => savePublishCfg({ ...publishCfg, path: e.target.value }),
          className: 'w-full mt-1 p-2 bg-gray-700 rounded',
          placeholder: 'data.json'
        })
      )
    ),
    React.createElement(
      'label',
      { className: 'block text-xs' },
      'GitHub Token (fine-grained, Contents: Read/Write):',
      React.createElement('input', {
        type: 'password',
        value: publishCfg.token || '',
        onChange: (e) => savePublishCfg({ ...publishCfg, token: e.target.value }),
        className: 'w-full mt-1 p-2 bg-gray-700 rounded',
        placeholder: 'ghp_…'
      })
    ),
    React.createElement(
      'label',
      { className: 'block text-xs' },
      'Commit message:',
      React.createElement('input', {
        type: 'text',
        value: commitMsg,
        onChange: (e) => setCommitMsg(e.target.value),
        className: 'w-full mt-1 p-2 bg-gray-700 rounded',
        placeholder: 'Update data.json from app'
      })
    ),
    React.createElement(
      'div',
      { className: 'grid grid-cols-2 gap-2' },
      React.createElement(
        'button',
        {
          onClick: () => savePublishCfg({ ...publishCfg }),
          className: 'bg-gray-700 hover:bg-gray-600 py-2 rounded text-sm'
        },
        'Save Settings'
      ),
      React.createElement(
        'button',
        {
          onClick: () => onPublish && onPublish(commitMsg),
          className: 'bg-green-600 hover:bg-green-700 py-2 rounded text-sm'
        },
        'Publish Now'
      )
    ),
    React.createElement(
      'p',
      { className: 'text-[11px] text-gray-400' },
      'Token is stored only in your browser (localStorage) and sent directly to GitHub when you Publish.'
    )
  );

  return React.createElement(
    'div',
    {
      className: 'bg-gray-900 text-white p-4 overflow-y-auto',
      style: { height: '100vh' }
    },
    React.createElement('h2', { className: 'text-xl font-bold mb-4' }, 'Editor'),
    
    selectedItems.length > 0 &&
      React.createElement(
        'div',
        { className: 'mb-4 p-3 bg-blue-900 bg-opacity-40 border border-blue-600 rounded' },
        React.createElement(
          'div',
          { className: 'flex items-center justify-between mb-2' },
          React.createElement(
            'span',
            { className: 'text-sm font-semibold' },
            `${selectedItems.length} item${selectedItems.length === 1 ? '' : 's'} selected`
          ),
          React.createElement(
            'button',
            {
              onClick: () => setSelectedItems([]),
              className: 'text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded'
            },
            'Clear Selection'
          )
        ),
        React.createElement(
          'div',
          { className: 'text-xs text-gray-300' },
          'Drag to move all selected items together'
        )
      ),
    
    React.createElement(
      'div',
      { className: 'flex gap-2 mb-4' },
      ['canvas', 'characters', 'connections', 'legend'].map((tab) =>
        React.createElement(
          'button',
          {
            key: tab,
            onClick: () => setActiveTab(tab),
            className: `px-3 py-1 rounded text-sm ${
              activeTab === tab ? 'bg-blue-600' : 'bg-gray-700'
            }`
          },
          tab.charAt(0).toUpperCase() + tab.slice(1)
        )
      )
    ),

    activeTab === 'canvas' && React.createElement(
      'div',
      null,
      React.createElement(
        'h3',
        { className: 'font-semibold mb-3 text-sm' },
        'Canvas Size'
      ),
      React.createElement(
        'div',
        { className: 'grid grid-cols-2 gap-3 mb-3' },
        React.createElement(
          'label',
          { className: 'block text-xs' },
          'Width (grid units):',
          React.createElement('input', {
            type: 'number',
            value: data.canvasWidth,
            onChange: (e) =>
              setData({
                ...data,
                canvasWidth: Math.max(20, parseInt(e.target.value) || 20)
              }),
            className: 'w-full mt-1 p-2 bg-gray-700 rounded text-sm',
            min: 20,
            max: 200
          })
        ),
        React.createElement(
          'label',
          { className: 'block text-xs' },
          'Height (grid units):',
          React.createElement('input', {
            type: 'number',
            value: data.canvasHeight,
            onChange: (e) =>
              setData({
                ...data,
                canvasHeight: Math.max(20, parseInt(e.target.value) || 20)
              }),
            className: 'w-full mt-1 p-2 bg-gray-700 rounded text-sm',
            min: 20,
            max: 200
          })
        )
      )
    ),

    activeTab === 'characters' && React.createElement(
      'div',
      null,
      React.createElement(
        'div',
        { className: 'flex gap-2 mb-3' },
        React.createElement(
          'button',
          {
            onClick: addCharacter,
            className:
              'flex-1 bg-green-600 hover:bg-green-700 px-3 py-2 rounded flex items-center justify-center gap-2 text-sm'
          },
          React.createElement(Plus, { size: 16 }),
          ' Add Character'
        ),
        React.createElement(
          'button',
          {
            onClick: () => setSelectedItems(data.characters.map(c => c.id)),
            className:
              'bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-sm'
          },
          'Select All'
        )
      ),
      React.createElement(
        'div',
        { className: 'space-y-2' },
        data.characters.map((char) =>
          React.createElement(
            'div',
            {
              key: char.id,
              className: `p-3 rounded cursor-pointer ${
                selectedItems.includes(char.id) 
                  ? 'bg-blue-600 ring-2 ring-blue-400' 
                  : selectedCharacter?.id === char.id 
                  ? 'bg-blue-700' 
                  : 'bg-gray-800'
              } hover:bg-gray-700`,
              onClick: () => setSelectedCharacter(char)
            },
            React.createElement(
              'div',
              { className: 'flex justify-between items-start' },
              React.createElement(
                'div',
                { className: 'flex-1' },
                React.createElement(
                  'div',
                  { className: 'font-semibold text-sm flex items-center gap-2' },
                  selectedItems.includes(char.id) && React.createElement(CheckSquare, { size: 14 }),
                  char.name
                ),
                React.createElement(
                  'div',
                  { className: 'text-xs text-gray-400' },
                  `Grid: (${char.gridX}, ${char.gridY})`
                )
              ),
              React.createElement(
                'button',
                {
                  onClick: (e) => {
                    e.stopPropagation();
                    deleteCharacter(char.id);
                  },
                  className: 'text-red-400 hover:text-red-300'
                },
                React.createElement(Trash2, { size: 16 })
              )
            )
          )
        )
      ),
      selectedCharacter && React.createElement(
        'div',
        { className: 'mt-4 p-3 bg-gray-800 rounded' },
        React.createElement(
          'h3',
          { className: 'font-semibold mb-3 text-sm' },
          'Edit Character'
        ),
        React.createElement(
          'label',
          { className: 'block mb-2 text-xs' },
          'Name:',
          React.createElement('input', {
            type: 'text',
            value: selectedCharacter.name,
            onChange: (e) =>
              updateCharacter(selectedCharacter.id, { name: e.target.value }),
            className: 'w-full mt-1 p-2 bg-gray-700 rounded text-sm'
          })
        ),
        React.createElement(
          'div',
          { className: 'grid grid-cols-2 gap-2 mt-2' },
          React.createElement(
            'label',
            { className: 'block text-xs' },
            'Grid X:',
            React.createElement('input', {
              type: 'number',
              value: selectedCharacter.gridX,
              onChange: (e) =>
                updateCharacter(selectedCharacter.id, {
                  gridX: Math.max(
                    0,
                    Math.min(data.canvasWidth - 1, parseInt(e.target.value) || 0)
                  )
                }),
              className: 'w-full mt-1 p-2 bg-gray-700 rounded text-sm',
              min: 0,
              max: data.canvasWidth - 1
            })
          ),
          React.createElement(
            'label',
            { className: 'block text-xs' },
            'Grid Y:',
            React.createElement('input', {
              type: 'number',
              value: selectedCharacter.gridY,
              onChange: (e) =>
                updateCharacter(selectedCharacter.id, {
                  gridY: Math.max(
                    0,
                    Math.min(data.canvasHeight - 1, parseInt(e.target.value) || 0)
                  )
                }),
              className: 'w-full mt-1 p-2 bg-gray-700 rounded text-sm',
              min: 0,
              max: data.canvasHeight - 1
            })
          )
        )
      )
    ),

    activeTab === 'connections' && React.createElement(
      'div',
      null,
      React.createElement(
        'button',
        {
          onClick: addConnection,
          className:
            'bg-green-600 hover:bg-green-700 px-3 py-2 rounded mb-3 flex items-center gap-2 text-sm'
        },
        React.createElement(Plus, { size: 16 }),
        ' Add Connection'
      ),
      React.createElement(
        'div',
        { className: 'space-y-2' },
        data.connections.map((conn) => {
          const fromChar = data.characters.find((c) => c.id === conn.from);
          const toChar = data.characters.find((c) => c.id === conn.to);
          return React.createElement(
            'div',
            {
              key: conn.id,
              className: `p-3 rounded cursor-pointer ${
                selectedConnection === conn.id ? 'bg-blue-600' : 'bg-gray-800'
              } hover:bg-gray-700`,
              onClick: () => setSelectedConnection(conn.id)
            },
            React.createElement(
              'div',
              { className: 'flex justify-between items-start mb-2' },
              React.createElement(
                'div',
                { className: 'text-xs' },
                `${fromChar?.name || 'Unknown'} → ${toChar?.name || 'Unknown'}`
              ),
              React.createElement(
                'button',
                {
                  onClick: (e) => {
                    e.stopPropagation();
                    deleteConnection(conn.id);
                  },
                  className: 'text-red-400 hover:text-red-300'
                },
                React.createElement(Trash2, { size: 16 })
              )
            ),
            selectedConnection === conn.id && React.createElement(
              'div',
              { className: 'grid grid-cols-2 gap-2 mt-2' },
              React.createElement(
                'label',
                { className: 'block text-xs' },
                'From:',
                React.createElement(
                  'select',
                  {
                    value: conn.from,
                    onChange: (e) => updateConnection(conn.id, { from: e.target.value }),
                    className: 'w-full mt-1 p-1 bg-gray-700 rounded text-xs'
                  },
                  data.characters.map((c) =>
                    React.createElement('option', { key: c.id, value: c.id }, c.name)
                  )
                )
              ),
              React.createElement(
                'label',
                { className: 'block text-xs' },
                'To:',
                React.createElement(
                  'select',
                  {
                    value: conn.to,
                    onChange: (e) => updateConnection(conn.id, { to: e.target.value }),
                    className: 'w-full mt-1 p-1 bg-gray-700 rounded text-xs'
                  },
                  data.characters.map((c) =>
                    React.createElement('option', { key: c.id, value: c.id }, c.name)
                  )
                )
              )
            )
          );
        })
      )
    ),

    activeTab === 'legend' && React.createElement(
        'div',
        { className: 'space-y-6' },
  
        // Trait Symbols
        React.createElement(
          'div',
          { className: 'p-3 bg-gray-800 rounded' },
          React.createElement('h3', { className: 'font-semibold mb-3 text-sm' }, 'Trait Symbols'),
          React.createElement(
            'div',
            { className: 'space-y-2' },
            Object.entries(data.legend.symbols).map(([sym, name]) =>
              React.createElement(
                'div',
                { key: sym, className: 'grid grid-cols-5 gap-2 items-center' },
                React.createElement('input', {
                  type: 'text',
                  value: sym,
                  onChange: (e) => replaceTraitSymbolEverywhere(sym, e.target.value),
                  className: 'col-span-1 p-2 bg-gray-700 rounded text-sm text-center',
                  maxLength: 3,
                  title: 'Icon / emoji'
                }),
                React.createElement('input', {
                  type: 'text',
                  value: name,
                  onChange: (e) => updateTraitName(sym, e.target.value),
                  className: 'col-span-3 p-2 bg-gray-700 rounded text-sm',
                  placeholder: 'Trait name'
                }),
                React.createElement(
                  'button',
                  {
                    onClick: () => deleteTrait(sym),
                    className: 'col-span-1 bg-red-600 hover:bg-red-700 px-2 py-2 rounded text-sm flex items-center justify-center'
                  },
                  React.createElement(Trash2, { size: 16 })
                )
              )
            )
          ),
          React.createElement(
            'button',
            {
              onClick: addTrait,
              className: 'mt-3 bg-green-600 hover:bg-green-700 px-3 py-2 rounded text-sm flex items-center gap-2'
            },
            React.createElement(Plus, { size: 16 }),
            ' Add Trait'
          )
        ),
  
        // Status Symbols
        React.createElement(
          'div',
          { className: 'p-3 bg-gray-800 rounded' },
          React.createElement('h3', { className: 'font-semibold mb-3 text-sm' }, 'Status Symbols'),
          React.createElement(
            'div',
            { className: 'space-y-2' },
            Object.entries(data.legend.statusSymbols || {}).map(([sym, name]) =>
              React.createElement(
                'div',
                { key: sym, className: 'grid grid-cols-5 gap-2 items-center' },
                React.createElement('input', {
                  type: 'text',
                  value: sym,
                  onChange: (e) => replaceStatusSymbolEverywhere(sym, e.target.value),
                  className: 'col-span-1 p-2 bg-gray-700 rounded text-sm text-center',
                  maxLength: 3,
                  title: 'Icon / emoji'
                }),
                React.createElement('input', {
                  type: 'text',
                  value: name,
                  onChange: (e) => updateStatusName(sym, e.target.value),
                  className: 'col-span-3 p-2 bg-gray-700 rounded text-sm',
                  placeholder: 'Status name'
                }),
                React.createElement(
                  'button',
                  {
                    onClick: () => deleteStatus(sym),
                    className: 'col-span-1 bg-red-600 hover:bg-red-700 px-2 py-2 rounded text-sm flex items-center justify-center'
                  },
                  React.createElement(Trash2, { size: 16 })
                )
              )
            )
          ),
          React.createElement(
            'button',
            {
              onClick: addStatus,
              className: 'mt-3 bg-green-600 hover:bg-green-700 px-3 py-2 rounded text-sm flex items-center gap-2'
            },
            React.createElement(Plus, { size: 16 }),
            ' Add Status'
          )
        ),
  
        // Sects / Factions
        React.createElement(
          'div',
          { className: 'p-3 bg-gray-800 rounded' },
          React.createElement('h3', { className: 'font-semibold mb-3 text-sm' }, 'Sects / Factions'),
          React.createElement(
            'div',
            { className: 'space-y-2' },
            Object.entries(data.legend.sects || {}).map(([key, sect]) =>
              React.createElement(
                'div',
                { key: key, className: 'grid grid-cols-6 gap-2 items-center' },
                React.createElement('input', {
                  type: 'text',
                  value: sect.name,
                  onChange: (e) => updateSectField(key, 'name', e.target.value),
                  className: 'col-span-4 p-2 bg-gray-700 rounded text-sm',
                  placeholder: 'Sect name'
                }),
                React.createElement('input', {
                  type: 'color',
                  value: sect.color || '#888888',
                  onChange: (e) => updateSectField(key, 'color', e.target.value),
                  className: 'col-span-1 h-9 p-1 bg-gray-700 rounded'
                }),
                React.createElement(
                  'button',
                  {
                    onClick: () => deleteSect(key),
                    className: 'col-span-1 bg-red-600 hover:bg-red-700 px-2 py-2 rounded text-sm flex items-center justify-center'
                  },
                  React.createElement(Trash2, { size: 16 })
                )
              )
            )
          ),
          React.createElement(
            'button',
            {
              onClick: addSect,
              className: 'mt-3 bg-green-600 hover:bg-green-700 px-3 py-2 rounded text-sm flex items-center gap-2'
            },
            React.createElement(Plus, { size: 16 }),
            ' Add Sect'
          )
        ),
  
        // Line Types
        React.createElement(
          'div',
          { className: 'p-3 bg-gray-800 rounded' },
          React.createElement('h3', { className: 'font-semibold mb-3 text-sm' }, 'Line Types'),
          React.createElement(
            'div',
            { className: 'space-y-2' },
            Object.entries(data.legend.lines || {}).map(([key, style]) =>
              React.createElement(
                'div',
                { key: key, className: 'grid grid-cols-8 gap-2 items-center' },
                React.createElement('input', {
                  type: 'text',
                  value: style.label || key,
                  onChange: (e) => updateLineField(key, 'label', e.target.value),
                  className: 'col-span-3 p-2 bg-gray-700 rounded text-sm',
                  placeholder: 'Line label'
                }),
                React.createElement('input', {
                  type: 'color',
                  value: style.color || '#ffffff',
                  onChange: (e) => updateLineField(key, 'color', e.target.value),
                  className: 'col-span-1 h-9 p-1 bg-gray-700 rounded'
                }),
                React.createElement('input', {
                  type: 'number',
                  value: style.thickness || 2,
                  min: 1,
                  max: 12,
                  onChange: (e) => updateLineField(key, 'thickness', Math.max(1, parseInt(e.target.value) || 1)),
                  className: 'col-span-1 p-2 bg-gray-700 rounded text-sm',
                  title: 'Thickness (px)'
                }),
                React.createElement(
                  'select',
                  {
                    value: style.style || 'solid',
                    onChange: (e) => updateLineField(key, 'style', e.target.value),
                    className: 'col-span-2 p-2 bg-gray-700 rounded text-sm'
                  },
                  React.createElement('option', { value: 'solid' }, 'normal'),
                  React.createElement('option', { value: 'dashed' }, 'dashed'),
                  React.createElement('option', { value: 'dotted' }, 'dotted'),
                  React.createElement('option', { value: 'double' }, 'double')
                ),
                React.createElement(
                  'button',
                  {
                    onClick: () => deleteLineType(key),
                    className: 'col-span-1 bg-red-600 hover:bg-red-700 px-2 py-2 rounded text-sm flex items-center justify-center'
                  },
                  React.createElement(Trash2, { size: 16 })
                )
              )
            )
          ),
          React.createElement(
            'button',
            {
              onClick: addLineType,
              className: 'mt-3 bg-green-600 hover:bg-green-700 px-3 py-2 rounded text-sm flex items-center gap-2'
            },
            React.createElement(Plus, { size: 16 }),
            ' Add Line'
          )
        )
      ),
    
    publishSection,
    
    React.createElement(
      'div',
      { className: 'mt-4 p-3 bg-gray-800 rounded space-y-2' },
      React.createElement(
        'button',
        {
          onClick: exportData,
          className:
            'w-full bg-blue-600 hover:bg-blue-700 py-2 rounded flex items-center justify-center gap-2 text-sm'
        },
        React.createElement(Save, { size: 16 }),
        ' Export Data'
      ),
      React.createElement(
        'label',
        {
          className:
            'w-full bg-green-600 hover:bg-green-700 py-2 rounded flex items-center justify-center gap-2 cursor-pointer text-sm'
        },
        React.createElement(Upload, { size: 16 }),
        ' Import Data',
        React.createElement('input', {
          type: 'file',
          accept: '.json',
          className: 'hidden',
          onChange: (e) => importData(e.target.files[0])
        })
      )
    )
  );
}

function CharacterMapper() {
  const [data, setData] = useState(() => {
    const d = { ...initialData };
    if (!d.canvasWidth) d.canvasWidth = 50;
    if (!d.canvasHeight) d.canvasHeight = 40;
    if (!d.legend.sects) d.legend.sects = {};
    if (!d.legend.statusSymbols) d.legend.statusSymbols = {};
    return d;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [modalCharacter, setModalCharacter] = useState(null);
  const [showLegend, setShowLegend] = useState(true);
  const [legendMinimized, setLegendMinimized] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [draggingMultiple, setDraggingMultiple] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('characters');
  const canvasRef = useRef(null);

  const [publishCfg, setPublishCfg] = useState(() => {
    try {
      const raw = localStorage.getItem('ghPublishConfig');
      return raw ? JSON.parse(raw) : { owner: '', repo: '', branch: 'main', path: 'data.json', token: '' };
    } catch {
      return { owner: '', repo: '', branch: 'main', path: 'data.json', token: '' };
    }
  });
  
  const savePublishCfg = (cfg) => {
    setPublishCfg(cfg);
    try { localStorage.setItem('ghPublishConfig', JSON.stringify(cfg)); } catch {}
  };
  
  const b64encodeUTF8 = (str) => {
    try {
      return btoa(unescape(encodeURIComponent(str)));
    } catch {
      const enc = new TextEncoder();
      const bytes = enc.encode(str);
      let binary = '';
      bytes.forEach((b) => (binary += String.fromCharCode(b)));
      return btoa(binary);
    }
  };
  
  const publishToGitHub = async (message = 'Update data.json from app') => {
    const { owner, repo, branch, path, token } = publishCfg || {};
    if (!owner || !repo || !path || !token) {
      alert('Set Owner, Repo, Path, and Token in Publish settings first.');
      return;
    }
    const apiBase = 'https://api.github.com';
    const contentUrl = `${apiBase}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`;
    const headers = {
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${token}`
    };
  
    let sha = undefined;
    try {
      const getResp = await fetch(`${contentUrl}?ref=${encodeURIComponent(branch || 'main')}`, { headers });
      if (getResp.status === 200) {
        const meta = await getResp.json();
        sha = meta.sha;
      }
    } catch (e) {
      console.warn('Could not retrieve existing file metadata:', e);
    }
  
    const body = {
      message: message || 'Update data.json from app',
      content: b64encodeUTF8(JSON.stringify(data, null, 2)),
      branch: branch || 'main'
    };
    if (sha) body.sha = sha;
  
    try {
      const putResp = await fetch(contentUrl, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body)
      });
      if (!putResp.ok) {
        throw new Error(`PUT failed: ${putResp.status}`);
      }
      alert('Published to GitHub successfully.');
    } catch (e) {
      console.error('Publish failed:', e);
      alert('Publish failed. Check console.');
    }
  };

  // === Connection interaction handlers (fix click-to-adjust) ===
  const handleWaypointDrag = (connId, wpIndex, e) => {
    if (!canvasRef.current) return;
    e.preventDefault();

    const rect = canvasRef.current.getBoundingClientRect();
    const getPos = (ev) => ({ x: ev.clientX - rect.left, y: ev.clientY - rect.top });

    const onMove = (ev) => {
      const { x, y } = getPos(ev);
      setData((prev) => {
        const connections = prev.connections.map((c) => {
          if (c.id !== connId) return c;
          const wps = [...(c.waypoints || [])];
          wps[wpIndex] = { x, y };
          return { ...c, waypoints: wps };
        });
        return { ...prev, connections };
      });
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleAddWaypoint = (connId, segmentIndex, x, y) => {
    setData((prev) => {
      const connections = prev.connections.map((c) => {
        if (c.id !== connId) return c;
        const wps = [...(c.waypoints || [])];
        // allPoints = [start, ...waypoints, end];
        // Insert after the start of the clicked segment.
        const insertAt = Math.max(0, Math.min(wps.length, segmentIndex));
        wps.splice(insertAt, 0, { x, y });
        return { ...c, waypoints: wps };
      });
      return { ...prev, connections };
    });
    setSelectedConnection(connId);
  };

  const handleDeleteWaypoint = (connId, wpIndex) => {
    setData((prev) => {
      const connections = prev.connections.map((c) => {
        if (c.id !== connId) return c;
        const wps = [...(c.waypoints || [])];
        wps.splice(wpIndex, 1);
        return { ...c, waypoints: wps };
      });
      return { ...prev, connections };
    });
  };

  const handleLabelDragStart = (connId, labelId, e) => {
    if (!canvasRef.current) return;
    e.preventDefault();

    const rect = canvasRef.current.getBoundingClientRect();
    const getPos = (ev) => ({ x: ev.clientX - rect.left, y: ev.clientY - rect.top });

    const projectT = (ax, ay, bx, by, px, py) => {
      const vx = bx - ax, vy = by - ay;
      const wx = px - ax, wy = py - ay;
      const denom = vx * vx + vy * vy || 1;
      let t = (vx * wx + vy * wy) / denom;
      if (!Number.isFinite(t)) t = 0;
      return Math.min(1, Math.max(0, t));
    };

    const onMove = (ev) => {
      const { x: px, y: py } = getPos(ev);
      setData((prev) => {
        const connections = prev.connections.map((c) => {
          if (c.id !== connId) return c;
          const labels = [...(c.labels || [])];
          const labelIdx = labels.findIndex((l) => l.id === labelId);
          if (labelIdx === -1) return c;

          // Recompute points for this connection
          const fromChar = prev.characters.find((ch) => ch.id === c.from);
          const toChar = prev.characters.find((ch) => ch.id === c.to);
          if (!fromChar || !toChar) return c;

          const getPoint = (char, side) => {
            const baseX = char.gridX * GRID_SIZE + TILE_WIDTH / 2;
            const baseY = char.gridY * GRID_SIZE + TILE_HEIGHT / 2;
            switch (side) {
              case 'top': return { x: baseX, y: char.gridY * GRID_SIZE };
              case 'bottom': return { x: baseX, y: char.gridY * GRID_SIZE + TILE_HEIGHT };
              case 'left': return { x: char.gridX * GRID_SIZE, y: baseY };
              case 'right': return { x: char.gridX * GRID_SIZE + TILE_WIDTH, y: baseY };
              default: return { x: baseX, y: baseY };
            }
          };

          const start = getPoint(fromChar, c.startSide || 'right');
          const end = getPoint(toChar, c.endSide || 'left');
          const pts = [start, ...(c.waypoints || []), end];

          const segIdx = Math.max(0, Math.min(pts.length - 2, labels[labelIdx].segmentIndex || 0));
          const a = pts[segIdx];
          const b = pts[segIdx + 1];

          const t = projectT(a.x, a.y, b.x, b.y, px, py);
          labels[labelIdx] = { ...labels[labelIdx], t };
          return { ...c, labels };
        });
        return { ...prev, connections };
      });
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleDragStart = (e, character) => {
    if (!isEditing) return;
    
    if (selectedItems.includes(character.id)) {
      e.dataTransfer.setData('multiDrag', 'true');
      e.dataTransfer.setData('draggedId', character.id);
      
      const dragInfo = selectedItems.map(id => {
        const char = data.characters.find(c => c.id === id);
        return {
          id,
          offsetX: char.gridX - character.gridX,
          offsetY: char.gridY - character.gridY
        };
      });
      
      setDraggingMultiple({
        items: dragInfo,
        anchorId: character.id
      });
    } else {
      e.dataTransfer.setData('characterId', character.id);
      e.dataTransfer.setData('multiDrag', 'false');
    }
  };

  const handleDrop = (e) => {
    if (!isEditing) return;
    e.preventDefault();
    
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Snap tile's top-left corner to the grid cell under the mouse
    const gridX = Math.floor(mouseX / GRID_SIZE);
    const gridY = Math.floor(mouseY / GRID_SIZE);

    const isMultiDrag = e.dataTransfer.getData('multiDrag') === 'true';
    
    if (isMultiDrag && draggingMultiple) {
      const newCharacters = data.characters.map(char => {
        const dragItem = draggingMultiple.items.find(item => item.id === char.id);
        if (dragItem) {
          const newX = Math.max(0, Math.min(data.canvasWidth - 1, gridX + dragItem.offsetX));
          const newY = Math.max(0, Math.min(data.canvasHeight - 1, gridY + dragItem.offsetY));
          return { ...char, gridX: newX, gridY: newY };
        }
        return char;
      });
      
      setData({ ...data, characters: newCharacters });
      setDraggingMultiple(null);
    } else {
      const characterId = e.dataTransfer.getData('characterId');
      const clampedX = Math.max(0, Math.min(data.canvasWidth - 1, gridX));
      const clampedY = Math.max(0, Math.min(data.canvasHeight - 1, gridY));

      setData({
        ...data,
        characters: data.characters.map((c) =>
          c.id === characterId ? { ...c, gridX: clampedX, gridY: clampedY } : c
        )
      });
    }
  };

  const handleDragOver = (e) => {
    if (isEditing) e.preventDefault();
  };

  const handleCharacterClick = (char, e) => {
    if (!isEditing) {
      setModalCharacter(char);
      return;
    }

    if (e.ctrlKey || e.metaKey) {
      if (selectedItems.includes(char.id)) {
        setSelectedItems(selectedItems.filter(id => id !== char.id));
      } else {
        setSelectedItems([...selectedItems, char.id]);
      }
    } else if (e.shiftKey) {
      if (selectedItems.includes(char.id)) {
        setSelectedItems(selectedItems.filter(id => id !== char.id));
      } else {
        setSelectedItems([...selectedItems, char.id]);
      }
    } else {
      setSelectedItems([]);
      setSelectedConnection(null);
      setSelectedCharacter(char);
      setActiveTab('characters');
    }
  };

  const handleEditClick = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
    } else {
      setIsEditing(!isEditing);
    }
  };

  const matchesSearch = (character) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const searchFields = [
      character.name,
      character.pronunciation,
      character.bio,
      ...(character.titles || []),
      ...(character.nicknames || [])
    ]
      .filter(Boolean)
      .map((s) => s.toLowerCase());
    return searchFields.some((field) => field.includes(query));
  };

  const canvasWidth = data.canvasWidth || 50;
  const canvasHeight = data.canvasHeight || 40;

  return React.createElement(
    'div',
    { className: 'min-h-screen bg-gray-950 flex' },
    isEditing &&
      isAuthenticated &&
      React.createElement(
        'div',
        { className: 'w-80 border-r border-gray-700' },
        React.createElement(EditPanel, {
          data,
          setData,
          selectedCharacter,
          setSelectedCharacter,
          selectedConnection,
          setSelectedConnection,
          activeTab,
          setActiveTab,
          publishCfg,
          savePublishCfg,
          onPublish: publishToGitHub,
          selectedItems,
          setSelectedItems
        })
      ),
    React.createElement(
      'div',
      { className: 'flex-1 flex' },
      showLegend &&
        React.createElement(
          'div',
          { className: 'p-4 bg-gray-950' },
          React.createElement(Legend, {
            legend: data.legend,
            isMinimized: legendMinimized,
            onToggleMinimize: () => setLegendMinimized(!legendMinimized)
          })
        ),
      React.createElement(
        'div',
        { className: 'flex-1 relative' },
        React.createElement(
          'div',
          { className: 'absolute top-4 right-4 z-10 flex gap-2 items-center' },
          !isEditing && (
            searchExpanded
              ? React.createElement(
                  'div',
                  {
                    className:
                      'flex items-center gap-2 bg-gray-800 rounded-lg shadow-lg border border-gray-700 px-3 py-2'
                  },
                  React.createElement('span', { className: 'text-white text-sm' }, '🔍'),
                  React.createElement('input', {
                    type: 'text',
                    value: searchQuery,
                    onChange: (e) => setSearchQuery(e.target.value),
                    placeholder: 'Search anything',
                    className:
                      'w-48 bg-gray-700 text-white px-2 py-1 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
                    autoFocus: true
                  }),
                  searchQuery &&
                    React.createElement(
                      'button',
                      {
                        onClick: () => setSearchQuery(''),
                        className: 'text-gray-400 hover:text-white text-xs'
                      },
                      '✖️'
                    ),
                  React.createElement(
                    'button',
                    {
                      onClick: () => {
                        setSearchExpanded(false);
                        setSearchQuery('');
                      },
                      className: 'text-gray-400 hover:text-white text-sm ml-1'
                    },
                    '◀'
                  )
                )
              : React.createElement(
                  'button',
                  {
                    onClick: () => setSearchExpanded(true),
                    className:
                      'bg-gray-800 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition text-sm',
                    title: 'Search characters'
                  },
                  '🔍'
                )
          ),
          React.createElement(
            'button',
            {
              onClick: () => setShowLegend(!showLegend),
              className:
                'bg-gray-800 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition text-sm'
            },
            showLegend ? 'Hide' : 'Show',
            ' Legend'
          ),
          React.createElement(
            'button',
            {
              onClick: handleEditClick,
              className:
                'bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 text-sm'
            },
            isEditing ? React.createElement(Eye, { size: 16 }) : React.createElement(Edit, { size: 16 }),
            isEditing ? ' View Mode' : ' Edit Mode'
          )
        ),
        React.createElement(
          'div',
          { className: 'overflow-auto h-screen p-8' },
          React.createElement(
            'div',
            {
              ref: canvasRef,
              className: 'relative bg-gray-900',
              style: {
                width: canvasWidth * GRID_SIZE,
                height: canvasHeight * GRID_SIZE,
                backgroundImage: isEditing
                  ? 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)'
                  : 'none',
                backgroundSize: isEditing ? `${GRID_SIZE}px ${GRID_SIZE}px` : 'auto'
              },
              onDrop: handleDrop,
              onDragOver: handleDragOver
            },
            React.createElement(
              'svg',
              {
                className: 'absolute inset-0 w-full h-full pointer-events-none'
              },
              React.createElement(
                'g',
                { className: 'pointer-events-auto' },
                data.connections.map((conn) =>
                  React.createElement(ConnectionLine, {
                    key: conn.id,
                    connection: conn,
                    characters: data.characters,
                    legend: data.legend,
                    isEditing: isEditing,
                    selectedConnection: selectedConnection,
                    onConnectionClick: (id) => {
                      setSelectedConnection(id);
                      setSelectedCharacter(null);
                    },
                    onWaypointDrag: handleWaypointDrag,
                    onAddWaypoint: handleAddWaypoint,
                    onDeleteWaypoint: handleDeleteWaypoint,
                    onLabelDragStart: handleLabelDragStart
                  })
                )
              )
            ),
            data.characters.map((char) => {
              const sectColor = char.sect && data.legend.sects?.[char.sect]?.color;
              const isMatch = matchesSearch(char);
              const hasSearchResults = searchQuery.trim() !== '';
              return React.createElement(CharacterTile, {
                key: char.id,
                character: char,
                onClick: (e) => handleCharacterClick(char, e),
                isEditing,
                onDragStart: (e) => handleDragStart(e, char),
                sectColor,
                isSelected: selectedItems.includes(char.id),
                isHighlighted: hasSearchResults && isMatch,
                isDimmed: hasSearchResults && !isMatch
              });
            })
          )
        )
      )
    ),
    modalCharacter &&
      React.createElement(CharacterModal, {
        character: modalCharacter,
        legend: data.legend,
        onClose: () => setModalCharacter(null),
        connections: data.connections,
        allCharacters: data.characters
      }),
    showAuthModal &&
      React.createElement(AuthModal, {
        onAuthenticate: () => {
          setIsAuthenticated(true);
          setIsEditing(true);
        },
        onClose: () => setShowAuthModal(false)
      })
  );
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

function initApp() {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(React.createElement(CharacterMapper));
  }
}