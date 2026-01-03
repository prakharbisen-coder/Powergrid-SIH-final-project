// Shared utilities and localStorage data layer for POWERGRID static site
(function () {
  const STORAGE_KEYS = {
    materials: 'pg_materials',
    budgets: 'pg_budgets',
    scenarios: 'pg_scenarios',
  };

  function loadData(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to load storage for', key, e);
      return fallback;
    }
  }

  function saveData(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('Failed to save storage for', key, e);
    }
  }

  function generateId(prefix = 'id') {
    return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
  }

  function download(filename, text, type = 'text/plain') {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function toCSV(rows) {
    if (!rows || !rows.length) return '';
    const headers = Object.keys(rows[0]);
    const escape = (val) => {
      const s = String(val ?? '');
      if (s.includes(',') || s.includes('\"') || s.includes('\n')) {
        return `"${s.replace(/\"/g, '"')}"`;
      }
      return s;
    };
    const lines = [headers.join(',')];
    for (const row of rows) {
      lines.push(headers.map((h) => escape(row[h])).join(','));
    }
    return lines.join('\n');
  }

  function determineMaterialStatus(m) {
    if (m.quantity <= 0) return 'out_of_stock';
    if (m.quantity < m.minStock) return 'low_stock';
    return 'in_stock';
  }

  // Seed demo data if empty
  const defaultMaterials = [
    { id: generateId('mat'), name: 'Steel Towers', category: 'Towers', unit: 'tons', quantity: 120, minStock: 80, region: 'North India' },
    { id: generateId('mat'), name: 'Aluminum Conductors', category: 'Conductors', unit: 'km', quantity: 540, minStock: 300, region: 'West India' },
    { id: generateId('mat'), name: 'Substation Transformers', category: 'Substations', unit: 'units', quantity: 18, minStock: 20, region: 'South India' },
    { id: generateId('mat'), name: 'Insulators', category: 'Others', unit: 'boxes', quantity: 75, minStock: 60, region: 'East India' },
  ];

  const defaultBudgets = {
    monthly: [
      { month: 'Jan', allocated: 250, actual: 230, optimized: 220 },
      { month: 'Feb', allocated: 240, actual: 235, optimized: 225 },
      { month: 'Mar', allocated: 230, actual: 225, optimized: 220 },
      { month: 'Apr', allocated: 220, actual: 215, optimized: 210 },
      { month: 'May', allocated: 210, actual: 200, optimized: 195 },
      { month: 'Jun', allocated: 200, actual: 190, optimized: 185 },
    ],
    breakdown: [
      { label: 'Materials', value: 380 },
      { label: 'Labor', value: 295 },
      { label: 'Transport', value: 165 },
      { label: 'Equipment', value: 210 },
    ],
  };

  const defaultScenarios = [];

  // Initialize storage on first run
  const initialized = loadData('pg_initialized', false);
  if (!initialized) {
    saveData(STORAGE_KEYS.materials, defaultMaterials);
    saveData(STORAGE_KEYS.budgets, defaultBudgets);
    saveData(STORAGE_KEYS.scenarios, defaultScenarios);
    saveData('pg_initialized', true);
  }

  // Expose global API
  window.PG = {
    STORAGE_KEYS,
    loadData,
    saveData,
    generateId,
    download,
    toCSV,
    determineMaterialStatus,
  };
})();