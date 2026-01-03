// Materials page functionality: add, filter, export, render table
(function () {
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  function render() {
    const materials = PG.loadData(PG.STORAGE_KEYS.materials, []);
    const search = $('#filterSearch').value.trim().toLowerCase();
    const status = $('#filterStatus').value;
    const category = $('#filterCategory').value;

    const filtered = materials.filter((m) => {
      const s = PG.determineMaterialStatus(m);
      const matchSearch = !search || m.name.toLowerCase().includes(search) || m.category.toLowerCase().includes(search) || m.region.toLowerCase().includes(search);
      const matchStatus = !status || status === 'all' || s === status;
      const matchCategory = !category || category === 'all' || m.category === category;
      return matchSearch && matchStatus && matchCategory;
    });

    const tbody = $('#materialsTableBody');
    tbody.innerHTML = '';
    for (const m of filtered) {
      const s = PG.determineMaterialStatus(m);
      const badgeClass = s === 'in_stock' ? 'bg-green-100 text-green-700' : s === 'low_stock' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700';
      const tr = document.createElement('tr');
      tr.className = 'border-b hover:bg-muted/50';
      tr.innerHTML = `
        <td class="p-2">${m.name}</td>
        <td class="p-2">${m.category}</td>
        <td class="p-2">${m.region}</td>
        <td class="p-2">${m.quantity} ${m.unit}</td>
        <td class="p-2">${m.minStock} ${m.unit}</td>
        <td class="p-2"><span class="inline-block rounded px-2 py-0.5 text-xs ${badgeClass}">${s.replace(/_/g,' ')}</span></td>
        <td class="p-2 text-right">
          <button class="text-blue-600 hover:underline mr-2" data-edit="${m.id}">Edit</button>
          <button class="text-red-600 hover:underline" data-del="${m.id}">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    }
  }

  function addMaterial(e) {
    e.preventDefault();
    const name = $('#newName').value.trim();
    const category = $('#newCategory').value;
    const unit = $('#newUnit').value.trim();
    const quantity = parseFloat($('#newQuantity').value);
    const minStock = parseFloat($('#newMinStock').value);
    const region = $('#newRegion').value;
    if (!name || !category || !unit || isNaN(quantity) || isNaN(minStock)) {
      alert('Please fill all fields');
      return;
    }
    const materials = PG.loadData(PG.STORAGE_KEYS.materials, []);
    materials.push({ id: PG.generateId('mat'), name, category, unit, quantity, minStock, region });
    PG.saveData(PG.STORAGE_KEYS.materials, materials);
    // reset form
    $('#newName').value = '';
    $('#newUnit').value = '';
    $('#newQuantity').value = '';
    $('#newMinStock').value = '';
    render();
  }

  function handleTableClick(e) {
    const idEdit = e.target.getAttribute('data-edit');
    const idDel = e.target.getAttribute('data-del');
    if (idEdit) {
      const materials = PG.loadData(PG.STORAGE_KEYS.materials, []);
      const m = materials.find((x) => x.id === idEdit);
      if (!m) return;
      const quantity = parseFloat(prompt('Update quantity', String(m.quantity)) || '');
      if (!isNaN(quantity)) {
        m.quantity = quantity;
        PG.saveData(PG.STORAGE_KEYS.materials, materials);
        render();
      }
    } else if (idDel) {
      const materials = PG.loadData(PG.STORAGE_KEYS.materials, []);
      const idx = materials.findIndex((x) => x.id === idDel);
      if (idx >= 0 && confirm('Delete material?')) {
        materials.splice(idx, 1);
        PG.saveData(PG.STORAGE_KEYS.materials, materials);
        render();
      }
    }
  }

  function exportCSV() {
    const materials = PG.loadData(PG.STORAGE_KEYS.materials, []);
    const csv = PG.toCSV(materials);
    PG.download('materials.csv', csv, 'text/csv');
  }

  function init() {
    // Populate category select
    const catSelect = $('#filterCategory');
    const materials = PG.loadData(PG.STORAGE_KEYS.materials, []);
    const cats = Array.from(new Set(materials.map((m) => m.category)));
    catSelect.innerHTML = '<option value="all">All Categories</option>' + cats.map((c) => `<option value="${c}">${c}</option>`).join('');

    // Hooks
    $('#newMaterialForm').addEventListener('submit', addMaterial);
    $('#materialsTableBody').addEventListener('click', handleTableClick);
    $('#filterSearch').addEventListener('input', render);
    $('#filterStatus').addEventListener('change', render);
    $('#filterCategory').addEventListener('change', render);
    $('#exportBtn').addEventListener('click', exportCSV);

    render();
  }

  document.addEventListener('DOMContentLoaded', init);
})();