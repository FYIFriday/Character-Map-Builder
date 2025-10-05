/* Character Map Builder – v7→v10 merge (Quinn, chart+syntax fix build)
   Adds:
   - Chart tab: control Grid Size (px per cell) and Canvas Size (cols/rows)
   Fixes:
   - Password gate (changeme123)
   - Working tab switcher (incl. Chart)
   - Restored sample data (Wei Wuxian / Lan Wangji)
   - Edit Character shows Traits (symbols) + Status
   - Legend update logic handles string maps (symbols/statusSymbols)
   - Fixed addLegendItem symbols/status bad syntax
   Kept: buttery grid-snapped drag (multi-select), click-to-open editor, waypoint add,
   draggable labels with side control, legend editor + cascade, search, import/export, publish.
*/

(() => {
    const { useState, useRef, useEffect } = React;
  
    // ---------- Icons ----------
    const Icon = ({ symbol, size = 16, className = '' }) =>
      React.createElement('span', { className: `inline-block ${className}`, style: { fontSize: `${size}px`, lineHeight: 1 } }, symbol);
    const PlusI = (p) => Icon({ symbol: '➕', ...p });
    const TrashI = (p) => Icon({ symbol: '🗑️', ...p });
    const XI = (p) => Icon({ symbol: '✖️', ...p });
    const SearchI = (p) => Icon({ symbol: '🔎', ...p });
  
    // ---------- Constants ----------
    const TILE_WIDTH = 100;
    const TILE_HEIGHT = 160;
    const EDIT_PASSWORD = 'changeme123';
    const STORAGE_KEY = 'character_map_data_v7v10_chart_build';
  
    // ---------- Sample data ----------
    const initialData = {
      gridSize: 20, // px per grid cell (editable in Chart tab)
      canvasWidth: 50,  // cols
      canvasHeight: 40, // rows
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
        // string maps: symbol -> meaning
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
          '🏥': 'Injured',
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
  
    // ---------- Helpers ----------
    const uid = (p='id_') => p + Math.random().toString(36).slice(2, 9);
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    const deepClone = (o) => JSON.parse(JSON.stringify(o));
    const sectColorOf = (data, sectKey) => data.legend?.sects?.[sectKey]?.color || 'rgba(2,6,23,0.9)';
  
    const lineStyleToDash = (style) => {
      if (!style) return '';
      if (style === 'dashed') return '6 4';
      if (style === 'dotted') return '2 4';
      return '';
    };
  
    // ---------- Auth Modal ----------
    function AuthModal({ onSuccess, onCancel }) {
      const [password, setPassword] = useState('');
      const [error, setError] = useState('');
      const submit = () => {
        if (password === EDIT_PASSWORD) {
          onSuccess();
        } else {
          setError('Incorrect password');
          setPassword('');
        }
      };
      return React.createElement('div',
        { className: 'fixed inset-0 bg-black/60 flex items-center justify-center z-50' },
        React.createElement('div',
          { className: 'bg-gray-900 text-white rounded p-4 w-80 border border-gray-700 shadow-xl' },
          React.createElement('div', { className: 'flex items-center justify-between mb-2' },
            React.createElement('h3', { className: 'font-semibold' }, 'Enter Edit Password'),
            React.createElement('button', { onClick: onCancel, className: 'text-gray-400 hover:text-white' }, React.createElement(XI, { size: 18 }))
          ),
          React.createElement('input', {
            type: 'password',
            value: password,
            onChange: (e) => setPassword(e.target.value),
            onKeyDown: (e) => e.key === 'Enter' && submit(),
            className: 'w-full p-2 bg-gray-700 rounded mb-2',
            placeholder: 'changeme123',
            autoFocus: true
          }),
          error && React.createElement('p', { className: 'text-red-400 text-xs mb-2' }, error),
          React.createElement('button',
            { className: 'w-full bg-blue-600 hover:bg-blue-700 py-2 rounded', onClick: submit },
            'Unlock Edit'
          )
        )
      );
    }
  
    // ---------- Character Tile ----------
    function CharacterTile({
      character, isEditing, isSelected, onOpenEdit, onToggleSelect, onDragStartWindow, sectColor, gridSize
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
  
      const onMouseDown = (e) => {
        if (!isEditing) return;
        if (e.button !== 0) return;
        if (e.metaKey || e.ctrlKey) onToggleSelect(character.id, 'toggle');
        else if (e.shiftKey) onToggleSelect(character.id, 'add');
        else if (!isSelected) onToggleSelect(character.id, 'solo');
        onDragStartWindow(e.clientX, e.clientY, character.id);
      };
  
      return React.createElement('div', {
        className: `absolute select-none rounded overflow-hidden shadow-lg border ${isSelected ? 'ring-2 ring-blue-500' : 'border-gray-700'} ${isEditing ? 'cursor-move' : 'cursor-pointer'}`,
        style: {
          left: character.gridX * gridSize + 'px',
          top: character.gridY * gridSize + 'px',
          width: TILE_WIDTH + 'px',
          height: TILE_HEIGHT + 'px',
          backgroundColor: '#0b0f1a'
        },
        onMouseDown,
        onClick: (e) => { e.stopPropagation(); if (!isEditing) onOpenEdit(character); }
      },
        React.createElement('div', { className: 'w-full h-full relative' },
          React.createElement('div', {
            className: 'w-full',
            style: {
              height: imageHeight + 'px',
              backgroundImage: character.image ? `url(${character.image})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: getObjectPosition(character.imagePosition)
            }
          }),
          React.createElement('div', {
            className: 'absolute bottom-0 left-0 right-0 px-2 py-1 flex items-center justify-between',
            style: { height: bannerHeight + 'px', backgroundColor: sectColor || 'rgba(2,6,23,0.9)' }
          },
            React.createElement('div', { className: 'text-white text-xs font-semibold truncate' }, character.name || 'Unnamed'),
            React.createElement('div', { className: 'text-white text-xs opacity-80 truncate' }, (character.titles || []).join(', '))
          )
        )
      );
    }
  
    // ---------- Connection geometry ----------
    const getTileAnchor = (char, side, gridSize) => {
      const cx = char.gridX * gridSize;
      const cy = char.gridY * gridSize;
      switch (side) {
        case 'top': return { x: cx + TILE_WIDTH/2, y: cy };
        case 'bottom': return { x: cx + TILE_WIDTH/2, y: cy + TILE_HEIGHT };
        case 'left': return { x: cx, y: cy + TILE_HEIGHT/2 };
        case 'right': return { x: cx + TILE_WIDTH, y: cy + TILE_HEIGHT/2 };
        default: return { x: cx + TILE_WIDTH/2, y: cy + TILE_HEIGHT/2 };
      }
    };
  
    // ---------- Connection Line ----------
    function ConnectionLine({
      data, connection, isEditing, isSelected,
      onConnectionClick, onAddWaypoint, onWaypointDrag, onDeleteWaypoint, onLabelDragStart
    }) {
      const gridSize = data.gridSize || 20;
      const fromChar = data.characters.find(c => c.id === connection.from);
      const toChar = data.characters.find(c => c.id === connection.to);
      if (!fromChar || !toChar) return null;
  
      const start = getTileAnchor(fromChar, connection.startSide, gridSize);
      const end = getTileAnchor(toChar, connection.endSide, gridSize);
      const waypoints = connection.waypoints || [];
      const points = [start, ...waypoints, end];
  
      const pathD = points.map((p,i)=> (i===0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
  
      const lineLegend = data.legend.lines[connection.type] || { color:'#fff', thickness:2, style:'solid', label: connection.type };
      const style = lineLegend.style || lineLegend.type || 'solid';
      const dash = lineStyleToDash(style);
  
      const ensureLabels = (conn) => (conn.labels && conn.labels.length) ? conn.labels : [
        { id:'start', segmentIndex:0, t:0.1, side:'auto' },
        { id:'end', segmentIndex:Math.max(0, points.length-2), t:0.9, side:'auto' }
      ];
  
      const clamp01 = (t)=> Math.max(0, Math.min(1, t));
      const pointOnSegment = (a,b,t)=>({ x:a.x + (b.x-a.x)*t, y:a.y + (b.y-a.y)*t });
      const normalize = (vx,vy)=>{ const L = Math.hypot(vx,vy)||1; return {x:vx/L, y:vy/L}; };
      const estimateTextWidth = (text, fontSize=10) => Math.round((text || '').length * (fontSize * 0.62)) + 10;
  
      const renderLabel = (lbl) => {
        const segIndex = Math.max(0, Math.min(points.length-2, lbl.segmentIndex||0));
        const a = points[segIndex], b = points[segIndex+1];
        const base = pointOnSegment(a,b, clamp01(lbl.t ?? 0.5));
        const tan = normalize(b.x-a.x, b.y-a.y);
        const normal = { x:-tan.y, y:tan.x };
  
        const text = (data.legend.lines[connection.type]?.label || connection.type) || '';
        const textW = estimateTextWidth(text);
        const labelH = 16, pad = 6, edge = 5;
  
        let cx = base.x, cy = base.y;
        switch(lbl.side||'auto'){
          case 'top': cy = base.y - (edge + labelH/2); break;
          case 'bottom': cy = base.y + (edge + labelH/2); break;
          case 'left': cx = base.x - (edge + textW/2); break;
          case 'right': cx = base.x + (edge + textW/2); break;
          case 'auto':
          default:
            cx = base.x + normal.x * (edge + labelH/2);
            cy = base.y + normal.y * (edge + labelH/2);
        }
  
        const rectX = cx - textW/2, rectY = cy - labelH/2;
  
        return React.createElement('g',{
          key:lbl.id,
          className: isEditing ? 'cursor-move' : '',
          onMouseDown:(e)=>{ if(!isEditing) return; e.stopPropagation(); onLabelDragStart && onLabelDragStart(connection.id, lbl.id, e); },
          onClick:(e)=>{ if(!isEditing) return; e.stopPropagation(); onConnectionClick && onConnectionClick(connection.id); }
        },
          React.createElement('rect',{ x:rectX, y:rectY, width:textW, height:labelH, fill:'rgba(0,0,0,0.8)', rx:3 }),
          React.createElement('text',{ x:cx, y:cy+3, fill:lineLegend.color, fontSize:10, textAnchor:'middle', className:'font-semibold pointer-events-none' }, text)
        );
      };
  
      const onPathMouseDown = (e) => {
        if (!isEditing || !isSelected) return;
        e.stopPropagation();
        const svg = e.currentTarget.ownerSVGElement || e.currentTarget;
        const r = svg.getBoundingClientRect();
        const pt = { x: e.clientX - r.left, y: e.clientY - r.top };
        let best = { idx:0, d2:Infinity, cx:pt.x, cy:pt.y };
        for (let i=0;i<points.length-1;i++){
          const a=points[i], b=points[i+1];
          const abx=b.x-a.x, aby=b.y-a.y, apx=pt.x-a.x, apy=pt.y-a.y;
          const ab2=abx*abx+aby*aby || 1;
          let t=(apx*abx+apy*aby)/ab2; t=Math.max(0,Math.min(1,t));
          const cx=a.x+abx*t, cy=a.y+aby*t;
          const dx=pt.x-cx, dy=pt.y-cy, d2=dx*dx+dy*dy;
          if (d2<best.d2) best={idx:i, d2, cx, cy};
        }
        onAddWaypoint && onAddWaypoint(connection.id, best.idx, best.cx, best.cy);
      };
  
      const pathStroke =
        (style === 'double')
          ? React.createElement(React.Fragment, null,
              React.createElement('path',{ d:pathD, stroke:'#000', strokeWidth:lineLegend.thickness+3, fill:'none', opacity:0.9 }),
              React.createElement('path',{ d:pathD, stroke:lineLegend.color, strokeWidth:lineLegend.thickness, strokeDasharray:dash, fill:'none' })
            )
          : React.createElement('path',{ d:pathD, stroke:lineLegend.color, strokeWidth:lineLegend.thickness, strokeDasharray:dash, fill:'none' });
  
      return React.createElement('g', null,
        isEditing && React.createElement('path',{
          d:pathD, stroke:'transparent', strokeWidth:20, fill:'none', className:'cursor-pointer', onClick:(e)=>{ e.stopPropagation(); onConnectionClick && onConnectionClick(connection.id); }
        }),
        pathStroke,
        React.createElement('circle',{ cx:start.x, cy:start.y, r:4, fill:lineLegend.color }),
        isEditing && isSelected && (connection.waypoints||[]).map((wp,i) =>
          React.createElement('g',{ key:i },
            React.createElement('circle',{
              cx:wp.x, cy:wp.y, r:6, fill:lineLegend.color, stroke:'white', strokeWidth:2, className:'cursor-move',
              onMouseDown:(e)=>{ e.stopPropagation(); onWaypointDrag(connection.id, i, e); }
            }),
            React.createElement('circle',{
              cx:wp.x+12, cy:wp.y-12, r:8, fill:'red', className:'cursor-pointer',
              onClick:(e)=>{ e.stopPropagation(); onDeleteWaypoint(connection.id, i); }
            }),
            React.createElement('text',{ x:wp.x+12, y:wp.y-9, fill:'white', fontSize:10, textAnchor:'middle', className:'pointer-events-none' }, '×')
          )
        ),
        ...(ensureLabels(connection).map(renderLabel)),
        isEditing && isSelected && React.createElement('path',{ d:pathD, stroke:'transparent', strokeWidth:12, fill:'none', onMouseDown:onPathMouseDown })
      );
    }
  
    // ---------- Legend (read-only) ----------
    function Legend({ legend, isMinimized, onToggleMinimize }) {
      return React.createElement('div',{ className:'w-64 border-r border-gray-800 rounded p-3 bg-gray-900/40 text-white' },
        React.createElement('div',{ className:'flex items-center justify-between mb-3' },
          React.createElement('h3',{ className:'font-semibold' },'Legend'),
          React.createElement('button',{ className:'text-xs px-2 py-1 bg-gray-700 rounded', onClick:onToggleMinimize }, isMinimized ? 'Expand' : 'Minimize')
        ),
        !isMinimized && React.createElement('div',{ className:'space-y-3' },
          React.createElement('div',null,
            React.createElement('div',{ className:'font-semibold text-sm mb-1' },'Traits'),
            React.createElement('div',null, Object.entries(legend.symbols||{}).map(([sym,meaning]) =>
              React.createElement('div',{ key:sym, className:'text-sm flex gap-2 items-center' },
                React.createElement('span',null,sym),
                React.createElement('span',{ className:'opacity-80' },meaning||'')
              )
            ))
          ),
          React.createElement('div',null,
            React.createElement('div',{ className:'font-semibold text-sm mb-1' },'Statuses'),
            React.createElement('div',null, Object.entries(legend.statusSymbols||{}).map(([sym,meaning]) =>
              React.createElement('div',{ key:sym, className:'text-sm flex gap-2 items-center' },
                React.createElement('span',null,sym),
                React.createElement('span',{ className:'opacity-80' },meaning||'')
              )
            ))
          ),
          React.createElement('div',null,
            React.createElement('div',{ className:'font-semibold text-sm mb-1' },'Sects'),
            React.createElement('div',{ className:'space-y-1' }, Object.entries(legend.sects||{}).map(([key, sect]) =>
              React.createElement('div',{ key, className:'flex items-center gap-2 text-sm' },
                React.createElement('div',{ className:'w-4 h-4 rounded', style:{ backgroundColor: sect.color }}),
                React.createElement('span',null,sect.name)
              )
            ))
          )
        )
      );
    }
  
    // ---------- Edit Panel (tabs incl. Chart) ----------
    function EditPanel({
      data, setData,
      selectedCharacter, setSelectedCharacter,
      selectedConnection, setSelectedConnection,
      activeTab, setActiveTab,
      publishCfg, savePublishCfg, onPublish
    }) {
      const [commitMsg, setCommitMsg] = useState('Update data.json from app');
  
      // Characters
      const addCharacter = () => {
        const c = {
          id: uid('char_'),
          name: 'New Character',
          pronunciation: '',
          titles: [],
          nicknames: [],
          gridX: 0, gridY: 0,
          image: '', imagePosition:'center',
          symbols: [], statusSymbol:'',
          bio: '', sect:''
        };
        setData({ ...data, characters: [...data.characters, c] });
      };
      const updateCharacter = (id, updates) => {
        const chars = data.characters.map(c => c.id===id ? { ...c, ...updates } : c);
        setData({ ...data, characters: chars });
        if (selectedCharacter?.id === id) setSelectedCharacter(chars.find(c=>c.id===id));
      };
      const deleteCharacter = (id) => {
        setData({
          ...data,
          characters: data.characters.filter(c => c.id !== id),
          connections: data.connections.filter(c => c.from !== id && c.to !== id)
        });
        if (selectedCharacter?.id === id) setSelectedCharacter(null);
      };
  
      // Connections
      const addConnection = () => {
        const c0 = data.characters[0]?.id || '';
        const c1 = data.characters[1]?.id || '';
        const typeKey = Object.keys(data.legend.lines)[0] || 'relation';
        const newConn = {
          id: uid('conn_'),
          from: c0, to: c1, type: typeKey,
          startSide:'right', endSide:'left',
          waypoints: [],
          labels: [
            { id: uid('lbl_'), segmentIndex:0, t:0.2, side:'auto' }
          ]
        };
        setData({ ...data, connections: [...data.connections, newConn] });
      };
      const updateConnection = (id, updates) => {
        setData({
          ...data,
          connections: data.connections.map(c => c.id===id ? { ...c, ...updates } : c)
        });
      };
      const deleteConnection = (id) => {
        setData({ ...data, connections: data.connections.filter(c=>c.id!==id) });
        if (selectedConnection === id) setSelectedConnection(null);
      };
  
      // Legend – add/rename/delete with cascade
      const updateLegend = (category, key, updates) => {
        const newLegend = deepClone(data.legend);
        if (updates === null) {
          delete newLegend[category][key];
        } else {
          if (category === 'symbols' || category === 'statusSymbols') {
            // string maps: symbol -> meaning
            newLegend[category][key] = (typeof updates === 'string') ? updates : (updates?.meaning || '');
          } else {
            // object maps
            newLegend[category][key] = { ...(newLegend[category][key]||{}), ...updates };
          }
        }
        setData({ ...data, legend: newLegend });
      };
      const renameLegendKey = (category, oldKey, newKey) => {
        if (!newKey || newKey === oldKey) return;
        const newLegend = deepClone(data.legend);
        const block = newLegend[category] || {};
        if (!(oldKey in block)) return;
        const val = block[oldKey];
        delete block[oldKey];
        block[newKey] = val;
  
        let chars = data.characters;
        let conns = data.connections;
        if (category === 'symbols') {
          chars = chars.map(c => ({ ...c, symbols: (c.symbols||[]).map(s => s===oldKey ? newKey : s) }));
        } else if (category === 'statusSymbols') {
          chars = chars.map(c => ({ ...c, statusSymbol: c.statusSymbol === oldKey ? newKey : c.statusSymbol }));
        } else if (category === 'lines') {
          conns = conns.map(co => ({ ...co, type: co.type === oldKey ? newKey : co.type }));
        } else if (category === 'sects') {
          chars = chars.map(c => ({ ...c, sect: c.sect === oldKey ? newKey : c.sect }));
        }
        setData({ ...data, legend: newLegend, characters: chars, connections: conns });
      };
  
      const addLegendItem = (category) => {
        if (category === 'sects') {
          const key = uid('sect_');
          updateLegend('sects', key, { name:'New Sect', color:'#6b7280' });
        } else if (category === 'symbols') {
          // FIXED: use string meaning, not an object with a comment key
          const key = '★';
          const newLegend = deepClone(data.legend);
          newLegend.symbols = newLegend.symbols || {};
          newLegend.symbols[key] = newLegend.symbols[key] ? `${newLegend.symbols[key]}*` : 'New Trait';
          setData({ ...data, legend:newLegend });
        } else if (category === 'statusSymbols') {
          const key = '✦';
          const newLegend = deepClone(data.legend);
          newLegend.statusSymbols = newLegend.statusSymbols || {};
          newLegend.statusSymbols[key] = newLegend.statusSymbols[key] ? `${newLegend.statusSymbols[key]}*` : 'New Status';
          setData({ ...data, legend:newLegend });
        } else if (category === 'lines') {
          const k = uid('line_');
          const style = { label:'New Line', color:'#ffffff', thickness:2, style:'solid' };
          const newLegend = deepClone(data.legend);
          newLegend.lines[k] = style;
          setData({ ...data, legend:newLegend });
        }
      };
  
      // Import / Export
      const exportData = () => {
        const blob = new Blob([JSON.stringify(data,null,2)], { type:'application/json' });
        const url = URL.createObjectURL(blob); const a = document.createElement('a');
        a.href = url; a.download = 'character-map-data.json'; a.click();
      };
      const importData = (file) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            const obj = JSON.parse(ev.target.result);
            setData(obj);
          } catch { alert('Import failed: invalid JSON'); }
        };
        reader.readAsText(file);
      };
  
      return React.createElement('div',{ className:'h-full overflow-y-auto p-3 text-white bg-gray-950' },
        // Tabs (now includes 'chart')
        React.createElement('div',{ className:'flex gap-2 border-b border-gray-800 pb-2 mb-3 text-sm' },
          ['characters','connections','legend','chart','publish'].map(tab =>
            React.createElement('button',{
              key:tab,
              className:`px-2 py-1 rounded ${activeTab===tab?'bg-blue-600':'bg-gray-800 hover:bg-gray-700'}`,
              onClick:()=>setActiveTab(tab)
            }, tab[0].toUpperCase()+tab.slice(1))
          )
        ),
  
        // Characters tab
        activeTab==='characters' && React.createElement('div',null,
          React.createElement('button',{ className:'bg-green-600 hover:bg-green-700 px-3 py-2 rounded mb-3 flex items-center gap-2 text-sm', onClick:addCharacter },
            React.createElement(PlusI,{size:16}),' Add Character'
          ),
          data.characters.map(ch =>
            React.createElement('div',{
              key:ch.id,
              className:`p-3 rounded cursor-pointer ${selectedCharacter?.id===ch.id?'bg-blue-600':'bg-gray-800'} hover:bg-gray-700`,
              onClick:()=>setSelectedCharacter(ch)
            },
              React.createElement('div',{ className:'flex items-start justify-between mb-2' },
                React.createElement('div', { className:'text-xs' }, ch.name || 'Unnamed'),
                React.createElement('div', { className:'flex gap-2' },
                  React.createElement('button',{ className:'bg-red-700 hover:bg-red-800 px-2 py-1 rounded text-xs', onClick:(e)=>{e.stopPropagation(); deleteCharacter(ch.id);} },
                    React.createElement(TrashI,{size:12}))
                )
              ),
              selectedCharacter?.id===ch.id && React.createElement('div',null,
                React.createElement('label',{ className:'block mb-2 text-xs' },'Name:',
                  React.createElement('input',{ type:'text', value:selectedCharacter.name, className:'w-full mt-1 p-2 bg-gray-700 rounded text-sm',
                    onChange:(e)=>updateCharacter(selectedCharacter.id,{ name:e.target.value }) })
                ),
                React.createElement('div',{ className:'grid grid-cols-2 gap-2 mt-2' },
                  React.createElement('label',{ className:'block text-xs' },'Grid X:',
                    React.createElement('input',{ type:'number', value:selectedCharacter.gridX, className:'w-full mt-1 p-2 bg-gray-700 rounded text-sm', min:0, max:data.canvasWidth-1,
                      onChange:(e)=>updateCharacter(selectedCharacter.id,{ gridX: clamp(parseInt(e.target.value)||0, 0, data.canvasWidth-1) }) })
                  ),
                  React.createElement('label',{ className:'block text-xs' },'Grid Y:',
                    React.createElement('input',{ type:'number', value:selectedCharacter.gridY, className:'w-full mt-1 p-2 bg-gray-700 rounded text-sm', min:0, max:data.canvasHeight-1,
                      onChange:(e)=>updateCharacter(selectedCharacter.id,{ gridY: clamp(parseInt(e.target.value)||0, 0, data.canvasHeight-1) }) })
                  )
                ),
                React.createElement('label',{ className:'block mb-2 text-xs' },'Titles (comma-separated):',
                  React.createElement('input',{ type:'text', value:(selectedCharacter.titles||[]).join(', '), className:'w-full mt-1 p-2 bg-gray-700 rounded text-sm',
                    onChange:(e)=>updateCharacter(selectedCharacter.id,{ titles: e.target.value.split(',').map(s=>s.trim()).filter(Boolean) }) })
                ),
                React.createElement('label',{ className:'block mb-2 text-xs' },'Nicknames (comma-separated):',
                  React.createElement('input',{ type:'text', value:(selectedCharacter.nicknames||[]).join(', '), className:'w-full mt-1 p-2 bg-gray-700 rounded text-sm',
                    onChange:(e)=>updateCharacter(selectedCharacter.id,{ nicknames: e.target.value.split(',').map(s=>s.trim()).filter(Boolean) }) })
                ),
                React.createElement('label',{ className:'block mb-2 text-xs' },'Bio:',
                  React.createElement('textarea',{ value:selectedCharacter.bio||'', className:'w-full mt-1 p-2 bg-gray-700 rounded text-sm',
                    onChange:(e)=>updateCharacter(selectedCharacter.id,{ bio: e.target.value }) })
                ),
                React.createElement('label',{ className:'block mb-2 text-xs' },'Sect:',
                  React.createElement('select',{ className:'w-full mt-1 p-1 bg-gray-700 rounded text-xs', value:selectedCharacter.sect||'',
                    onChange:(e)=>updateCharacter(selectedCharacter.id,{ sect:e.target.value }) },
                    React.createElement('option',{ value:'' },'—'),
                    ...Object.entries(data.legend.sects||{}).map(([k,s])=> React.createElement('option',{key:k, value:k}, s.name || k))
                  )
                ),
                // Traits (symbols) multi-select
                React.createElement('div', { className:'mb-2' },
                  React.createElement('h4',{ className:'text-white font-semibold mb-2 text-sm' }, 'Symbols (Traits)'),
                  React.createElement('div',{ className:'mt-1 p-2 bg-gray-700 rounded max-h-32 overflow-y-auto' },
                    Object.entries(data.legend.symbols || {}).length === 0
                      ? React.createElement('div',{ className:'text-gray-400 text-xs' }, 'No symbols defined in Legend')
                      : Object.entries(data.legend.symbols || {}).map(([emoji, meaning]) => {
                          const isChecked = (selectedCharacter.symbols||[]).includes(emoji);
                          return React.createElement('label',{
                            key:emoji, className:'flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-600 px-1 rounded'
                          },
                            React.createElement('input',{
                              type:'checkbox', checked:isChecked,
                              onChange:(e)=>{
                                const current = selectedCharacter.symbols || [];
                                const next = e.target.checked ? [...current, emoji] : current.filter(s=>s!==emoji);
                                updateCharacter(selectedCharacter.id, { symbols: next });
                              }
                            }),
                            React.createElement('span',{ className:'text-lg' }, emoji),
                            React.createElement('span',{ className:'text-xs opacity-80' }, meaning)
                          );
                        })
                  )
                ),
                // Status Symbol
                React.createElement('label',{ className:'block mb-2 text-xs' }, 'Status Symbol:',
                  React.createElement('select', { className:'w-full mt-1 p-2 bg-gray-700 rounded text-sm',
                    value:selectedCharacter.statusSymbol || '',
                    onChange:(e)=>updateCharacter(selectedCharacter.id, { statusSymbol: e.target.value })
                  },
                    React.createElement('option',{ value:'' },'None'),
                    ...Object.entries(data.legend.statusSymbols || {}).map(([emoji,meaning]) =>
                      React.createElement('option',{ key:emoji, value:emoji }, `${emoji} ${meaning}`)
                    )
                  )
                ),
                // Image
                React.createElement('label',{ className:'block mb-2 text-xs' },'Image URL:',
                  React.createElement('input',{ type:'text', value:selectedCharacter.image || '', className:'w-full mt-1 p-2 bg-gray-700 rounded text-sm',
                    onChange:(e)=>updateCharacter(selectedCharacter.id,{ image:e.target.value }), placeholder:'https://...' })
                ),
                React.createElement('label',{ className:'block mb-2 text-xs' },'Image Position:',
                  React.createElement('select',{ className:'w-full mt-1 p-2 bg-gray-700 rounded text-sm', value:selectedCharacter.imagePosition || 'center',
                    onChange:(e)=>updateCharacter(selectedCharacter.id,{ imagePosition:e.target.value }) },
                    ...['top','center','bottom','top-left','top-right','bottom-left','bottom-right'].map(p =>
                      React.createElement('option',{ key:p, value:p }, p)
                    )
                  )
                )
              )
            )
          )
        ),
  
        // Connections tab
        activeTab==='connections' && React.createElement('div',null,
          React.createElement('button',{ className:'bg-green-600 hover:bg-green-700 px-3 py-2 rounded mb-3 flex items-center gap-2 text-sm', onClick:addConnection },
            React.createElement(PlusI,{size:16}),' Add Connection'
          ),
          data.connections.map(conn=>{
            const fromChar = data.characters.find(c=>c.id===conn.from);
            const toChar   = data.characters.find(c=>c.id===conn.to);
            return React.createElement('div',{
              key:conn.id,
              className:`p-3 rounded cursor-pointer ${selectedConnection===conn.id?'bg-blue-600':'bg-gray-800'} hover:bg-gray-700`,
              onClick:()=>setSelectedConnection(conn.id)
            },
              React.createElement('div',{ className:'flex items-start justify-between mb-2' },
                React.createElement('div',{ className:'text-xs' }, `${fromChar?.name||'Unknown'} → ${toChar?.name||'Unknown'}`),
                React.createElement('button',{ className:'bg-red-700 hover:bg-red-800 px-2 py-1 rounded text-xs', onClick:(e)=>{e.stopPropagation(); deleteConnection(conn.id);} },
                  React.createElement(TrashI,{size:12}))
              ),
              selectedConnection===conn.id && React.createElement('div',null,
                React.createElement('div',{ className:'grid grid-cols-2 gap-2' },
                  React.createElement('label',{ className:'block text-xs' }, 'From:',
                    React.createElement('select',{ className:'w-full mt-1 p-1 bg-gray-700 rounded text-xs', value:conn.from, onChange:(e)=>updateConnection(conn.id,{ from:e.target.value }), onClick:(e)=>e.stopPropagation() },
                      ...data.characters.map(c=>React.createElement('option',{key:c.id,value:c.id},c.name))
                    )
                  ),
                  React.createElement('label',{ className:'block text-xs' }, 'To:',
                    React.createElement('select',{ className:'w-full mt-1 p-1 bg-gray-700 rounded text-xs', value:conn.to, onChange:(e)=>updateConnection(conn.id,{ to:e.target.value }), onClick:(e)=>e.stopPropagation() },
                      ...data.characters.map(c=>React.createElement('option',{key:c.id,value:c.id},c.name))
                    )
                  ),
                  React.createElement('label',{ className:'block text-xs col-span-2' }, 'Type:',
                    React.createElement('select',{ className:'w-full mt-1 p-1 bg-gray-700 rounded text-xs', value:conn.type, onChange:(e)=>updateConnection(conn.id,{ type:e.target.value }) },
                      ...Object.entries(data.legend.lines).map(([k,v])=> React.createElement('option',{key:k, value:k}, v.label || k))
                    )
                  ),
                  React.createElement('label',{ className:'block text-xs' }, 'Start Side:',
                    React.createElement('select',{ className:'w-full mt-1 p-1 bg-gray-700 rounded text-xs', value:conn.startSide, onChange:(e)=>updateConnection(conn.id,{ startSide:e.target.value }) },
                      ...['top','bottom','left','right'].map(s=>React.createElement('option',{key:s,value:s}, s[0].toUpperCase()+s.slice(1)))
                    )
                  ),
                  React.createElement('label',{ className:'block text-xs' }, 'End Side:',
                    React.createElement('select',{ className:'w-full mt-1 p-1 bg-gray-700 rounded text-xs', value:conn.endSide, onChange:(e)=>updateConnection(conn.id,{ endSide:e.target.value }) },
                      ...['top','bottom','left','right'].map(s=>React.createElement('option',{key:s,value:s}, s[0].toUpperCase()+s.slice(1)))
                    )
                  )
                ),
                // Label manager
                React.createElement('div',{ className:'mt-3 p-2 bg-gray-800 rounded' },
                  React.createElement('div',{ className:'flex items-center justify-between mb-2' },
                    React.createElement('h4',{ className:'font-semibold text-sm' },'Line Labels'),
                    React.createElement('button',{ className:'bg-green-600 hover:bg-green-700 text-xs px-2 py-1 rounded flex items-center gap-1',
                      onClick:(e)=>{ e.stopPropagation();
                        const labels = (conn.labels && conn.labels.length) ? conn.labels.slice() : [];
                        labels.push({ id: uid('lbl_'), segmentIndex:0, t:0.5, side:'auto' });
                        updateConnection(conn.id,{ labels });
                      } },
                      React.createElement(PlusI,{size:12}),'Add Label'
                    )
                  ),
                  ((conn.labels&&conn.labels.length)? conn.labels : []).map(lbl =>
                    React.createElement('div',{ key:lbl.id, className:'flex items-center justify-between gap-2 mb-2 bg-gray-900 px-2 py-2 rounded' },
                      React.createElement('div',{ className:'text-xs flex-1' }, `${fromChar?.name||'??'} → ${toChar?.name||'??'}`),
                      React.createElement('label',{ className:'text-xs flex items-center gap-1' },'Side:',
                        React.createElement('select',{ className:'bg-gray-700 rounded px-1 py-0.5 text-xs', value:lbl.side||'auto',
                          onChange:(e)=>{
                            const labels = (conn.labels||[]).map(l => l.id===lbl.id ? { ...l, side:e.target.value } : l);
                            updateConnection(conn.id,{ labels });
                          } },
                          ...[['auto','Auto'],['top','Top'],['bottom','Bottom'],['left','Left'],['right','Right']].map(([v,L])=>React.createElement('option',{key:v,value:v},L))
                        )
                      ),
                      React.createElement('button',{ className:'bg-red-700 hover:bg-red-800 px-2 py-1 rounded text-xs',
                        onClick:(e)=>{ e.stopPropagation();
                          const labels = (conn.labels||[]).filter(l=>l.id!==lbl.id);
                          updateConnection(conn.id,{ labels });
                        } }, 'Delete')
                    )
                  )
                )
              )
            );
          })
        ),
  
        // Legend tab
        activeTab==='legend' && React.createElement('div',{ className:'space-y-4' },
          // Traits (symbols)
          React.createElement('div', null,
            React.createElement('div',{ className:'font-semibold mb-1' },'Traits (Symbols)'),
            Object.entries(data.legend.symbols||{}).map(([sym,meaning]) =>
              React.createElement('div',{ key:sym, className:'flex gap-2 items-center mb-2' },
                React.createElement('input',{ className:'w-16 bg-gray-700 rounded px-2 py-1', defaultValue:sym,
                  onBlur:(e)=>{ const n=e.target.value||sym; if(n!==sym) renameLegendKey('symbols', sym, n); } }),
                React.createElement('input',{ className:'flex-1 bg-gray-700 rounded px-2 py-1', value:meaning||'',
                  onChange:(e)=>updateLegend('symbols', sym, e.target.value) }),
                React.createElement('button',{ className:'bg-red-700 hover:bg-red-800 px-2 py-1 rounded text-xs',
                  onClick:()=>updateLegend('symbols', sym, null) }, 'Delete')
              )
            ),
            React.createElement('button',{ className:'bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-xs', onClick:()=>addLegendItem('symbols') },'Add Trait')
          ),
          // Status editor
          React.createElement('div', null,
            React.createElement('div',{ className:'font-semibold mb-1' },'Statuses'),
            Object.entries(data.legend.statusSymbols||{}).map(([sym,meaning]) =>
              React.createElement('div',{ key:sym, className:'flex gap-2 items-center mb-2' },
                React.createElement('input',{ className:'w-16 bg-gray-700 rounded px-2 py-1', defaultValue:sym,
                  onBlur:(e)=>{ const n=e.target.value||sym; if(n!==sym) renameLegendKey('statusSymbols', sym, n); } }),
                React.createElement('input',{ className:'flex-1 bg-gray-700 rounded px-2 py-1', value:meaning||'',
                  onChange:(e)=>updateLegend('statusSymbols', sym, e.target.value) }),
                React.createElement('button',{ className:'bg-red-700 hover:bg-red-800 px-2 py-1 rounded text-xs',
                  onClick:()=>updateLegend('statusSymbols', sym, null) }, 'Delete')
              )
            ),
            React.createElement('button',{ className:'bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-xs', onClick:()=>addLegendItem('statusSymbols') },'Add Status')
          ),
          // Sects editor
          React.createElement('div', null,
            React.createElement('div',{ className:'font-semibold mb-1' },'Sects'),
            Object.entries(data.legend.sects||{}).map(([key,sect]) =>
              React.createElement('div',{ key, className:'flex gap-2 items-center mb-2' },
                React.createElement('input',{ className:'w-32 bg-gray-700 rounded px-2 py-1', defaultValue:key,
                  onBlur:(e)=>{ const newKey = e.target.value || key; if (newKey!==key) renameLegendKey('sects', key, newKey); } }),
                React.createElement('input',{ className:'flex-1 bg-gray-700 rounded px-2 py-1', value:sect.name||'',
                  onChange:(e)=>updateLegend('sects', key, { name:e.target.value }) }),
                React.createElement('input',{ type:'color', className:'bg-gray-700 rounded w-10 h-8', value: sect.color||'#6b7280',
                  onChange:(e)=>updateLegend('sects', key, { color:e.target.value }) }),
                React.createElement('button',{ className:'bg-red-700 hover:bg-red-800 px-2 py-1 rounded text-xs',
                  onClick:()=>updateLegend('sects', key, null) }, 'Delete')
              )
            ),
            React.createElement('button',{ className:'bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-xs', onClick:()=>addLegendItem('sects') },'Add Sect')
          ),
          // Line styles editor
          React.createElement('div', null,
            React.createElement('div',{ className:'font-semibold mb-1' },'Line Styles'),
            Object.entries(data.legend.lines||{}).map(([key,style]) =>
              React.createElement('div',{ key, className:'grid grid-cols-6 gap-2 items-center mb-2' },
                React.createElement('input',{ className:'col-span-2 bg-gray-700 rounded px-2 py-1', defaultValue:key,
                  onBlur:(e)=>{ const n=e.target.value||key; if(n!==key) renameLegendKey('lines', key, n); } }),
                React.createElement('input',{ className:'bg-gray-700 rounded px-2 py-1', value:style.label||'',
                  onChange:(e)=>updateLegend('lines', key, { label:e.target.value }) }),
                React.createElement('input',{ type:'color', className:'bg-gray-700 rounded w-10 h-8', value:style.color||'#ffffff',
                  onChange:(e)=>updateLegend('lines', key, { color:e.target.value }) }),
                React.createElement('input',{ type:'number', min:1, max:12, className:'bg-gray-700 rounded px-2 py-1', value:style.thickness||2,
                  onChange:(e)=>updateLegend('lines', key, { thickness: clamp(parseInt(e.target.value)||2,1,12) }) }),
                React.createElement('select',{ className:'bg-gray-700 rounded px-2 py-1', value:style.style||style.type||'solid',
                  onChange:(e)=>updateLegend('lines', key, { style:e.target.value }) },
                  ...['solid','dashed','dotted','double'].map(t => React.createElement('option',{ key:t, value:t }, t))
                ),
                React.createElement('button',{ className:'col-span-6 bg-red-700 hover:bg-red-800 px-2 py-1 rounded text-xs',
                  onClick:()=>updateLegend('lines', key, null) }, 'Delete')
              )
            ),
            React.createElement('button',{ className:'bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-xs', onClick:()=>addLegendItem('lines') },'Add Line Style')
          )
        ),
  
        // Chart tab (NEW)
        activeTab==='chart' && React.createElement(ChartPanel, { data, setData }),
  
        // Publish tab
        activeTab==='publish' && React.createElement(PublishPanel, {
          data, publishCfg, savePublishCfg, onPublish,
          commitMsg, setCommitMsg, importData, exportData
        })
      );
    }
  
    function ChartPanel({ data, setData }) {
      const [gridSize, setGridSize] = useState(data.gridSize || 20);
      const [cols, setCols] = useState(data.canvasWidth || 50);
      const [rows, setRows] = useState(data.canvasHeight || 40);
  
      const apply = () => {
        const g = clamp(parseInt(gridSize)||20, 8, 80);
        const w = clamp(parseInt(cols)||50, 5, 400);
        const h = clamp(parseInt(rows)||40, 5, 400);
  
        // Clamp any characters outside bounds after resize
        const clampedChars = (data.characters||[]).map(c => ({
          ...c,
          gridX: clamp(c.gridX, 0, w - 1),
          gridY: clamp(c.gridY, 0, h - 1)
        }));
        setData({ ...data, gridSize: g, canvasWidth: w, canvasHeight: h, characters: clampedChars });
      };
  
      return React.createElement('div', { className:'space-y-4 text-sm' },
        React.createElement('div', { className:'font-semibold' }, 'Chart Settings'),
        React.createElement('div', { className:'grid grid-cols-2 gap-3' },
          React.createElement('label', null, 'Grid Size (px/cell)',
            React.createElement('input', {
              type:'number', min:8, max:80, value:gridSize,
              onChange:(e)=>setGridSize(e.target.value),
              className:'w-full mt-1 p-2 bg-gray-700 rounded'
            })
          ),
          React.createElement('div', null,
            React.createElement('div', { className:'text-xs opacity-75' }, 'Preview'),
            React.createElement('div', {
              className:'mt-1 border border-gray-700 rounded',
              style:{
                width: Math.min(10* (data.gridSize||20), 200)+'px',
                height: Math.min(6* (data.gridSize||20), 120)+'px',
                backgroundSize:`${(data.gridSize||20)}px ${(data.gridSize||20)}px`,
                backgroundImage:'linear-gradient(to right, rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.15) 1px, transparent 1px)'
              }
            })
          ),
          React.createElement('label', null, 'Canvas Width (cols)',
            React.createElement('input', {
              type:'number', min:5, max:400, value:cols,
              onChange:(e)=>setCols(e.target.value),
              className:'w-full mt-1 p-2 bg-gray-700 rounded'
            })
          ),
          React.createElement('label', null, 'Canvas Height (rows)',
            React.createElement('input', {
              type:'number', min:5, max:400, value:rows,
              onChange:(e)=>setRows(e.target.value),
              className:'w-full mt-1 p-2 bg-gray-700 rounded'
            })
          )
        ),
        React.createElement('div', { className:'flex gap-2' },
          React.createElement('button', { className:'bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded', onClick:apply }, 'Apply'),
          React.createElement('div', { className:'text-xs opacity-75 self-center' }, `Current: ${data.canvasWidth}×${data.canvasHeight} @ ${data.gridSize}px`)
        )
      );
    }
  
    function PublishPanel({ data, publishCfg, savePublishCfg, onPublish, commitMsg, setCommitMsg, importData, exportData }) {
      return React.createElement('div', null,
        React.createElement('div',{ className:'p-3 bg-blue-900/20 border border-blue-800 rounded space-y-2' },
          React.createElement('div',{ className:'text-sm font-semibold' },'Publish (Global): Update data.json on GitHub'),
          React.createElement('div',{ className:'grid grid-cols-2 gap-2 text-xs' },
            React.createElement('label',null,'Owner:',
              React.createElement('input',{ type:'text', className:'w-full mt-1 p-2 bg-gray-700 rounded', value:publishCfg.owner||'',
                onChange:(e)=>savePublishCfg({ ...publishCfg, owner:e.target.value }) })
            ),
            React.createElement('label',null,'Repo:',
              React.createElement('input',{ type:'text', className:'w-full mt-1 p-2 bg-gray-700 rounded', value:publishCfg.repo||'',
                onChange:(e)=>savePublishCfg({ ...publishCfg, repo:e.target.value }) })
            ),
            React.createElement('label',null,'Branch:',
              React.createElement('input',{ type:'text', className:'w-full mt-1 p-2 bg-gray-700 rounded', value:publishCfg.branch||'main',
                onChange:(e)=>savePublishCfg({ ...publishCfg, branch:e.target.value }) })
            ),
            React.createElement('label',null,'Path:',
              React.createElement('input',{ type:'text', className:'w-full mt-1 p-2 bg-gray-700 rounded', value:publishCfg.path||'data.json',
                onChange:(e)=>savePublishCfg({ ...publishCfg, path:e.target.value }) })
            ),
            React.createElement('label',{ className:'col-span-2' },'Token:',
              React.createElement('input',{ type:'password', className:'w-full mt-1 p-2 bg-gray-700 rounded', value:publishCfg.token||'',
                onChange:(e)=>savePublishCfg({ ...publishCfg, token:e.target.value }) })
            )
          ),
          React.createElement('label',null,'Commit message:',
            React.createElement('input',{ type:'text', className:'w-full mt-1 p-2 bg-gray-700 rounded text-sm', value:commitMsg, onChange:(e)=>setCommitMsg(e.target.value) })
          ),
          React.createElement('div',{ className:'flex gap-2' },
            React.createElement('button',{ className:'bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-sm', onClick:()=>onPublish(commitMsg) },'Publish'),
            React.createElement('label',{ className:'bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded text-sm cursor-pointer' },
              'Import JSON',
              React.createElement('input',{ type:'file', accept:'.json', className:'hidden', onChange:(e)=>importData(e.target.files?.[0]) })
            ),
            React.createElement('button',{ className:'bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded text-sm', onClick:exportData },'Export JSON')
          )
        )
      );
    }
  
    // ---------- App ----------
    function App(){
      const [data, setData] = useState(()=>{
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) {
            const loaded = JSON.parse(raw);
            if ((!loaded.characters || loaded.characters.length === 0) && (!loaded.connections || loaded.connections.length === 0)) {
              return deepClone(initialData);
            }
            // ensure gridSize defaults
            if (!loaded.gridSize) loaded.gridSize = 20;
            return loaded;
          }
        } catch {}
        return deepClone(initialData);
      });
  
      const [isEditing, setIsEditing] = useState(false);
      const [isAuthenticated, setIsAuthenticated] = useState(false);
      const [showAuth, setShowAuth] = useState(false);
      const [showLegend, setShowLegend] = useState(true);
      const [legendMinimized, setLegendMinimized] = useState(false);
      const [selectedCharacter, setSelectedCharacter] = useState(null);
      const [selectedConnection, setSelectedConnection] = useState(null);
      const [selectedIds, setSelectedIds] = useState(new Set());
      const [searchQuery, setSearchQuery] = useState('');
      const [searchExpanded, setSearchExpanded] = useState(false);
      const [activeTab, setActiveTab] = useState('characters');
  
      const gridSize = data.gridSize || 20;
  
      // Persist local
      useEffect(()=>{ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }catch{} }, [data]);
  
      // Keyboard select helpers
      useEffect(()=>{
        const onKeyDown = (e) => {
          if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase()==='a'){ e.preventDefault(); setSelectedIds(new Set(data.characters.map(c=>c.id))); }
          if (e.key==='Escape'){ setSelectedIds(new Set()); setSelectedCharacter(null); setSelectedConnection(null); }
        };
        window.addEventListener('keydown', onKeyDown);
        return ()=>window.removeEventListener('keydown', onKeyDown);
      }, [data.characters]);
  
      const toggleSelect = (id, mode='toggle') => {
        setSelectedConnection(null);
        setSelectedCharacter(data.characters.find(c=>c.id===id) || null);
        setActiveTab('characters');
        setSelectedIds(prev=>{
          const next = new Set(prev);
          if (mode==='solo'){ next.clear(); next.add(id); }
          else if (mode==='add'){ next.add(id); }
          else { next.has(id) ? next.delete(id) : next.add(id); }
          return next;
        });
      };
  
      // Robust window-driven drag (group-aware)
      const dragAnchorId = useRef(null);
      const lastDragPos = useRef({x:0,y:0});
      const applyDelta = (dx,dy, anchorId) => {
        const stepX = Math.round(dx/gridSize);
        const stepY = Math.round(dy/gridSize);
        if (!stepX && !stepY) return;
        setData(prev=>{
          const group = (selectedIds.size && selectedIds.has(anchorId)) ? selectedIds : new Set([anchorId]);
          return {
            ...prev,
            characters: prev.characters.map(c =>
              group.has(c.id)
                ? { ...c,
                      gridX: clamp(c.gridX + stepX, 0, prev.canvasWidth - 1),
                      gridY: clamp(c.gridY + stepY, 0, prev.canvasHeight - 1) }
                : c)
          };
        });
      };
      const startWindowDrag = (clientX, clientY, anchorId) => {
        dragAnchorId.current = anchorId;
        lastDragPos.current = { x:clientX, y:clientY };
        const onMove = (e) => {
          if (!dragAnchorId.current) return;
          const dx = e.clientX - lastDragPos.current.x;
          const dy = e.clientY - lastDragPos.current.y;
          if (dx || dy) {
            applyDelta(dx,dy, dragAnchorId.current);
            lastDragPos.current = { x:e.clientX, y:e.clientY };
          }
        };
        const onUp = () => {
          dragAnchorId.current = null;
          window.removeEventListener('mousemove', onMove);
          window.removeEventListener('mouseup', onUp);
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
      };
  
      // Waypoint/Label drags
      const canvasRef = useRef(null);
      const draggingWaypoint = useRef(null);
      const draggingLabel = useRef(null);
  
      const handleMouseMove = (e) => {
        if (draggingWaypoint.current){
          const { connId, wpIndex } = draggingWaypoint.current;
          const rect = canvasRef.current.getBoundingClientRect();
          const x = clamp(Math.round((e.clientX - rect.left)), 0, data.canvasWidth*gridSize);
          const y = clamp(Math.round((e.clientY - rect.top)), 0, data.canvasHeight*gridSize);
          setData(prev=>({
            ...prev,
            connections: prev.connections.map(c => c.id===connId ? {
              ...c,
              waypoints: (c.waypoints||[]).map((wp,i)=> i===wpIndex ? { x, y } : wp)
            } : c)
          }));
        } else if (draggingLabel.current){
          const { connId, lblId } = draggingLabel.current;
          const conn = data.connections.find(c=>c.id===connId);
          if (!conn) return;
          const from = data.characters.find(c=>c.id===conn.from);
          const to   = data.characters.find(c=>c.id===conn.to);
          if (!from || !to) return;
  
          const start = getTileAnchor(from, conn.startSide, gridSize);
          const end = getTileAnchor(to, conn.endSide, gridSize);
          const pts = [start, ...(conn.waypointsß