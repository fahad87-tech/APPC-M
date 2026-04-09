import html
import os

files = {
    'exam': 'Exam_Timer.html',
    'jigsaw': 'Jigsaw.html',
    'rotation': 'Class_Rotation.html',
    'randomizer': 'Randomizer.html',
    'group': 'Random_Group.html',
    'curving_ap': 'AP_Curving_Tool.html',
    'curving_formula': 'Curving_Tool.html'
}

contents = {}
for key, filename in files.items():
    if os.path.exists(filename):
        with open(filename, 'r', encoding='utf-8') as f:
            contents[key] = html.escape(f.read())
    else:
        print(f"[Error] {filename} not found!")

if len(contents) < 7:
    print("Missing files. Aborting.")
    exit(1)

html_template = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Mr. Fahad Teacher Pro</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  body {{
    margin: 0;
    font-family: 'Inter', system-ui, sans-serif;
    background: #0f172a;
    color: #f8fafc;
    height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }}
  .app-header-container {{
    max-height: 260px;
    overflow: hidden;
    transition: max-height 0.28s ease;
  }}
  body.header-collapsed .app-header-container {{
    max-height: 0;
  }}
  body.header-collapsed.header-hover-open .app-header-container {{
    max-height: 260px;
  }}
  .app-header {{
    display: flex;
    align-items: center;
    background: rgba(0, 0, 0, 0.5);
    padding: 12px 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    z-index: 10;
    flex-wrap: wrap;
    gap: 12px;
  }}
  .top-hover-zone {{
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 14px;
    z-index: 30;
    pointer-events: none;
  }}
  body.header-collapsed .top-hover-zone {{
    pointer-events: auto;
  }}
  .header-toggle-btn {{
    position: fixed;
    top: 6px;
    right: 12px;
    z-index: 40;
    width: 34px;
    height: 28px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    background: rgba(15, 23, 42, 0.84);
    color: #e2e8f0;
    cursor: pointer;
    font-size: 16px;
    font-weight: 700;
    line-height: 1;
    transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
  }}
  .header-toggle-btn:hover {{
    background: rgba(30, 41, 59, 0.95);
    border-color: rgba(255, 255, 255, 0.3);
  }}
  .header-toggle-btn:active {{
    transform: translateY(1px);
  }}
  .app-title {{
    font-size: 18px;
    font-weight: 700;
    margin-right: 32px;
    background: linear-gradient(to right, #a78bfa, #f472b6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    letter-spacing: 0.5px;
  }}
  .tab-bar {{
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }}
  .tab-btn {{
    padding: 8px 20px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: #e2e8f0;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    transition: all 0.2s;
  }}
  .tab-btn:hover {{
    background: rgba(255, 255, 255, 0.15);
  }}
  .tab-btn.active {{
    background: #8b5cf6;
    border-color: #a78bfa;
    color: #ffffff;
    box-shadow: 0 0 15px rgba(139, 92, 246, 0.4);
  }}
  .iframe-container {{
    flex: 1;
    position: relative;
    background: #000;
  }}
  iframe {{
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    border: none;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s ease;
  }}
  iframe.active {{
    opacity: 1;
    pointer-events: auto;
    z-index: 5;
  }}
</style>
</head>
<body>

<div id="topHoverZone" class="top-hover-zone"></div>
<button id="headerToggleBtn" class="header-toggle-btn" aria-label="Toggle header" aria-expanded="true">▴</button>

<div class="app-header-container">
  <div class="app-header">
    <div class="app-title">✨ Mr. Fahad Teacher Pro</div>
    <div class="tab-bar">
      <button class="tab-btn active" data-tab-id="exam" draggable="true">Exam Timer</button>
      <button class="tab-btn" data-tab-id="randomizer" draggable="true">Randomizer Wheel</button>
      <button class="tab-btn" data-tab-id="group" draggable="true">Random Groups</button>
      <button class="tab-btn" data-tab-id="jigsaw" draggable="true">Jigsaw Expert</button>
      <button class="tab-btn" data-tab-id="rotation" draggable="true">Class Rotation</button>
      <button class="tab-btn" data-tab-id="apcurving" draggable="true">AP Curving Tool</button>
      <button class="tab-btn" data-tab-id="curving" draggable="true">Curving Tool</button>
    </div>
  </div>
</div>

<div class="iframe-container">
  <iframe id="frame-exam" class="active" srcdoc="{contents['exam']}"></iframe>
  <iframe id="frame-randomizer" srcdoc="{contents['randomizer']}"></iframe>
  <iframe id="frame-group" srcdoc="{contents['group']}"></iframe>
  <iframe id="frame-jigsaw" srcdoc="{contents['jigsaw']}"></iframe>
  <iframe id="frame-rotation" srcdoc="{contents['rotation']}"></iframe>
  <iframe id="frame-apcurving" srcdoc="{contents['curving_ap']}"></iframe>
  <iframe id="frame-curving" srcdoc="{contents['curving_formula']}"></iframe>
</div>

<script>
const tabBar = document.querySelector('.tab-bar');
const appHeader = document.querySelector('.app-header-container');
const topHoverZone = document.getElementById('topHoverZone');
const headerToggleBtn = document.getElementById('headerToggleBtn');
const TAB_ORDER_STORAGE_KEY = 'teacher-pro-tab-order-v1';
const HEADER_COLLAPSED_STORAGE_KEY = 'teacher-pro-header-collapsed-v1';
let isHeaderCollapsed = false;
let hoverCloseTimer = null;

function getTabButtons() {{
  return Array.from(document.querySelectorAll('.tab-btn'));
}}

function getTabOrder() {{
  return getTabButtons().map(btn => btn.dataset.tabId);
}}

function saveTabOrder() {{
  localStorage.setItem(TAB_ORDER_STORAGE_KEY, JSON.stringify(getTabOrder()));
}}

function applySavedTabOrder() {{
  const saved = localStorage.getItem(TAB_ORDER_STORAGE_KEY);
  if (!saved) return;
  let order;
  try {{
    order = JSON.parse(saved);
  }} catch {{
    return;
  }}
  if (!Array.isArray(order)) return;

  const buttonsById = new Map(getTabButtons().map(btn => [btn.dataset.tabId, btn]));
  order.forEach(tabId => {{
    const btn = buttonsById.get(tabId);
    if (btn) tabBar.appendChild(btn);
  }});

  getTabButtons().forEach(btn => {{
    if (!order.includes(btn.dataset.tabId)) {{
      tabBar.appendChild(btn);
    }}
  }});
}}

function switchTab(tabId) {{
  getTabButtons().forEach(el => el.classList.remove('active'));
  document.querySelectorAll('iframe').forEach(el => el.classList.remove('active'));

  const btn = tabBar.querySelector(`[data-tab-id="${{tabId}}"]`);
  if (btn) btn.classList.add('active');
  document.getElementById('frame-' + tabId).classList.add('active');
}}

function notifyEmbeddedAppsResize() {{
  window.dispatchEvent(new Event('resize'));
  document.querySelectorAll('iframe').forEach(frame => {{
    try {{
      frame.contentWindow.dispatchEvent(new Event('resize'));
    }} catch {{}}
  }});
}}

function setHeaderCollapsed(collapsed, persist = true) {{
  isHeaderCollapsed = collapsed;
  document.body.classList.toggle('header-collapsed', collapsed);
  if (!collapsed) document.body.classList.remove('header-hover-open');
  headerToggleBtn.textContent = collapsed ? '▾' : '▴';
  headerToggleBtn.setAttribute('aria-expanded', String(!collapsed));
  if (persist) localStorage.setItem(HEADER_COLLAPSED_STORAGE_KEY, collapsed ? '1' : '0');
  notifyEmbeddedAppsResize();
}}

function setHeaderHoverOpen(open) {{
  if (!isHeaderCollapsed) return;
  document.body.classList.toggle('header-hover-open', open);
  notifyEmbeddedAppsResize();
}}

function clearHoverCloseTimer() {{
  if (!hoverCloseTimer) return;
  clearTimeout(hoverCloseTimer);
  hoverCloseTimer = null;
}}

function queueHeaderHoverClose() {{
  if (!isHeaderCollapsed) return;
  clearHoverCloseTimer();
  hoverCloseTimer = setTimeout(() => {{
    setHeaderHoverOpen(false);
  }}, 220);
}}

function initHeaderControls() {{
  setHeaderCollapsed(localStorage.getItem(HEADER_COLLAPSED_STORAGE_KEY) === '1', false);
  headerToggleBtn.addEventListener('click', () => {{
    clearHoverCloseTimer();
    setHeaderCollapsed(!isHeaderCollapsed, true);
  }});
  topHoverZone.addEventListener('mouseenter', () => {{
    clearHoverCloseTimer();
    setHeaderHoverOpen(true);
  }});
  topHoverZone.addEventListener('mouseleave', () => {{
    queueHeaderHoverClose();
  }});
  appHeader.addEventListener('mouseenter', () => {{
    clearHoverCloseTimer();
    if (isHeaderCollapsed) setHeaderHoverOpen(true);
  }});
  appHeader.addEventListener('mouseleave', () => {{
    queueHeaderHoverClose();
  }});
}}

let draggedButton = null;

function initTabReordering() {{
  getTabButtons().forEach(btn => {{
    btn.addEventListener('click', () => switchTab(btn.dataset.tabId));
    btn.addEventListener('dragstart', (event) => {{
      draggedButton = btn;
      event.dataTransfer.effectAllowed = 'move';
    }});
    btn.addEventListener('dragover', (event) => {{
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
    }});
    btn.addEventListener('drop', (event) => {{
      event.preventDefault();
      if (!draggedButton || draggedButton === btn) return;

      const rect = btn.getBoundingClientRect();
      const dropBefore = event.clientX < rect.left + rect.width / 2;
      if (dropBefore) {{
        tabBar.insertBefore(draggedButton, btn);
      }} else {{
        tabBar.insertBefore(draggedButton, btn.nextSibling);
      }}
      saveTabOrder();
    }});
    btn.addEventListener('dragend', () => {{
      draggedButton = null;
    }});
  }});
}}

applySavedTabOrder();
initTabReordering();
initHeaderControls();
</script>

</body>
</html>
"""

with open('Combined_App.html', 'w', encoding='utf-8') as f:
    f.write(html_template)

print("Created Combined_App.html successfully.")
