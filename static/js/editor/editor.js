window.EditorApp = (() => {
  let canvas;
  let currentTool = 'select';
  let isPanning = false;
  let lastPos = { x: 0, y: 0 };
  let editMaskImage = false;

  const state = {
    templateId: null,
    saveUrl: null,
    loadUrl: null,
    duplicateUrl: null,
    thumbnailUrl: null,
  };

  function setActiveTool(tool) {
    currentTool = tool;
    canvas.isDrawingMode = tool === 'draw';
  }

  function addText() {
    const text = new fabric.IText('Votre texte', {
      left: 100,
      top: 100,
      fill: '#111827',
      fontSize: 32,
    });
    canvas.add(text).setActiveObject(text);
  }

  function addRect() {
    const rect = new fabric.Rect({
      left: 120,
      top: 120,
      width: 200,
      height: 120,
      fill: '#93c5fd',
      rx: 12,
      ry: 12,
    });
    canvas.add(rect).setActiveObject(rect);
  }

  function addCircle() {
    const circle = new fabric.Circle({
      left: 140,
      top: 140,
      radius: 60,
      fill: '#fca5a5',
    });
    canvas.add(circle).setActiveObject(circle);
  }

  function addImage(file) {
    const reader = new FileReader();
    reader.onload = () => {
      fabric.Image.fromURL(reader.result, (img) => {
        img.set({ left: 150, top: 150, scaleX: 0.5, scaleY: 0.5 });
        canvas.add(img).setActiveObject(img);
      });
    };
    reader.readAsDataURL(file);
  }

  function updateLayers() {
    const layers = document.getElementById('layers');
    layers.innerHTML = '';
    canvas.getObjects().slice().reverse().forEach((obj, index) => {
      const li = document.createElement('li');
      li.className = 'flex items-center justify-between';
      li.innerHTML = `<span>${obj.type}</span>`;
      const buttons = document.createElement('div');
      buttons.className = 'flex gap-1';
      const up = document.createElement('button');
      up.textContent = '↑';
      up.onclick = () => { canvas.bringForward(obj); canvas.renderAll(); updateLayers(); };
      const down = document.createElement('button');
      down.textContent = '↓';
      down.onclick = () => { canvas.sendBackwards(obj); canvas.renderAll(); updateLayers(); };
      buttons.appendChild(up);
      buttons.appendChild(down);
      li.appendChild(buttons);
      layers.appendChild(li);
    });
  }

  function updateProperties() {
    const props = document.getElementById('properties');
    const obj = canvas.getActiveObject();
    if (!obj) {
      props.textContent = 'Sélectionnez un objet.';
      return;
    }
    props.innerHTML = `Type: ${obj.type}<br>Opacité: ${Math.round(obj.opacity * 100)}%`;
  }

  function applyMask() {
    const active = canvas.getActiveObjects();
    if (active.length !== 2) {
      alert('Sélectionnez une forme et une image.');
      return;
    }
    const image = active.find(obj => obj.type === 'image');
    const shape = active.find(obj => obj.type !== 'image');
    if (!image || !shape) {
      alert('Sélectionnez une forme et une image.');
      return;
    }
    shape.clipPath = null;
    image.clipPath = shape;
    image.clipPath.absolutePositioned = true;
    canvas.remove(shape);
    canvas.setActiveObject(image);
    canvas.renderAll();
  }

  function detachMask() {
    const obj = canvas.getActiveObject();
    if (obj && obj.clipPath) {
      const shape = obj.clipPath;
      obj.clipPath = null;
      shape.left = obj.left;
      shape.top = obj.top;
      canvas.add(shape);
      canvas.renderAll();
    }
  }

  function toggleEditMask() {
    const obj = canvas.getActiveObject();
    if (!obj || !obj.clipPath) {
      alert('Sélectionnez une image masquée.');
      return;
    }
    editMaskImage = !editMaskImage;
    obj.selectable = true;
    if (editMaskImage) {
      obj.lockMovementX = false;
      obj.lockMovementY = false;
    }
  }

  function bindCanvasEvents() {
    canvas.on('selection:created', updateProperties);
    canvas.on('selection:updated', updateProperties);
    canvas.on('selection:cleared', updateProperties);
    canvas.on('object:added', updateLayers);
    canvas.on('object:removed', updateLayers);
    canvas.on('object:modified', updateLayers);

    canvas.on('mouse:wheel', (opt) => {
      if (!opt.e.ctrlKey) {
        return;
      }
      const delta = opt.e.deltaY;
      let zoom = canvas.getZoom();
      zoom *= 0.999 ** delta;
      zoom = Math.min(Math.max(zoom, 0.2), 4);
      canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
      opt.e.preventDefault();
    });

    canvas.on('mouse:down', (opt) => {
      if (opt.e.spaceKey || opt.e.key === ' ') {
        isPanning = true;
        lastPos = { x: opt.e.clientX, y: opt.e.clientY };
      }
    });

    canvas.on('mouse:move', (opt) => {
      if (isPanning) {
        const vpt = canvas.viewportTransform;
        vpt[4] += opt.e.clientX - lastPos.x;
        vpt[5] += opt.e.clientY - lastPos.y;
        canvas.requestRenderAll();
        lastPos = { x: opt.e.clientX, y: opt.e.clientY };
      }
    });

    canvas.on('mouse:up', () => { isPanning = false; });
  }

  async function loadTemplate() {
    const resp = await fetch(state.loadUrl);
    const data = await resp.json();
    canvas.setWidth(data.width);
    canvas.setHeight(data.height);
    canvas.loadFromJSON(data.fabric_json, () => {
      canvas.renderAll();
      updateLayers();
    });
  }

  async function saveTemplate() {
    const json = canvas.toJSON(['clipPath']);
    await fetch(state.saveUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCSRFToken() },
      body: JSON.stringify(json),
    });
    const thumbnail = canvas.toDataURL({ format: 'png', multiplier: 0.2 });
    await fetch(state.thumbnailUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCSRFToken() },
      body: JSON.stringify({ image: thumbnail }),
    });
  }

  function getCSRFToken() {
    const name = 'csrftoken';
    const value = document.cookie.split('; ').find(row => row.startsWith(name));
    return value ? value.split('=')[1] : '';
  }

  function initToolbar() {
    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('bg-slate-100'));
        btn.classList.add('bg-slate-100');
        setActiveTool(btn.dataset.tool);
        if (btn.dataset.tool === 'text') addText();
        if (btn.dataset.tool === 'rect') addRect();
        if (btn.dataset.tool === 'circle') addCircle();
        if (btn.dataset.tool === 'image') {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.onchange = () => { if (input.files[0]) addImage(input.files[0]); };
          input.click();
        }
      });
    });

    document.getElementById('save-btn').addEventListener('click', saveTemplate);
    document.getElementById('duplicate-btn').addEventListener('click', async () => {
      const resp = await fetch(state.duplicateUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCSRFToken() },
        body: JSON.stringify({}),
      });
      const data = await resp.json();
      if (data.template_id) {
        window.location.href = `/templates/${data.template_id}/edit/`;
      }
    });
    document.getElementById('export-btn').addEventListener('click', () => {
      const link = document.createElement('a');
      link.download = 'invitation.png';
      link.href = canvas.toDataURL({ format: 'png' });
      link.click();
    });
    document.getElementById('zoom-in').addEventListener('click', () => {
      canvas.setZoom(Math.min(canvas.getZoom() + 0.1, 4));
    });
    document.getElementById('zoom-out').addEventListener('click', () => {
      canvas.setZoom(Math.max(canvas.getZoom() - 0.1, 0.2));
    });
    document.getElementById('fit').addEventListener('click', () => {
      const wrapper = canvas.getElement().parentElement.getBoundingClientRect();
      const scale = Math.min(wrapper.width / canvas.getWidth(), wrapper.height / canvas.getHeight());
      canvas.setZoom(scale);
      canvas.viewportTransform[4] = 0;
      canvas.viewportTransform[5] = 0;
      canvas.renderAll();
    });
    document.getElementById('reset-view').addEventListener('click', () => {
      canvas.setZoom(1);
      canvas.viewportTransform[4] = 0;
      canvas.viewportTransform[5] = 0;
      canvas.renderAll();
    });
    document.getElementById('mask-btn').addEventListener('click', applyMask);
    document.getElementById('mask-edit-btn').addEventListener('click', toggleEditMask);
    document.getElementById('mask-detach-btn').addEventListener('click', detachMask);
  }

  function init(config) {
    Object.assign(state, config);
    canvas = new fabric.Canvas('editor-canvas', { preserveObjectStacking: true });
    canvas.freeDrawingBrush.color = '#111827';
    canvas.freeDrawingBrush.width = 2;
    bindCanvasEvents();
    initToolbar();
    loadTemplate();
  }

  return { init };
})();
