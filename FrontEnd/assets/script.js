// ===== Helpers =====
const getToken = () => sessionStorage.getItem('token') || localStorage.getItem('token');

// ===== DOM refs =====
const gallery         = document.querySelector('.gallery');
const filtersDiv      = document.querySelector('.filters');

const editBtn         = document.getElementById('open-edit-mode');
const modal           = document.getElementById('admin-modal');
const backdrop        = modal.querySelector('.modal-backdrop');
const closeBtn        = document.getElementById('modal-close');
const backBtn         = document.getElementById('back-to-gallery');

const galleryView     = document.getElementById('view-gallery');
const addView         = document.getElementById('view-add');
const openAddBtn      = document.getElementById('open-add-view');

const thumbsContainer = document.querySelector('.modal-thumbs');
const titleEl         = document.getElementById('modal-title');

const form            = document.getElementById('add-photo-form');
const fileInput       = document.getElementById('photo-input');
const titleInput      = document.getElementById('title-input');
const categorySelect  = document.getElementById('category-select');
const confirmBtn      = document.querySelector('.btn-confirm');

// Optional logout button (only if you add it in HTML)
const logoutBtn       = document.getElementById('logout-btn');

// ===== State =====
let allJobs = [];
let previewURL; // for image preview memory cleanup

// ===== Rendering helpers =====
function renderGallery(jobs) {
  gallery.innerHTML = '';
  jobs.forEach(({ id, imageUrl, title }) => {
    const fig = document.createElement('figure');
    fig.dataset.id = id;
    fig.innerHTML = `
      <img src="${imageUrl}" alt="${title}">
      <figcaption>${title}</figcaption>
    `;
    gallery.appendChild(fig);
  });
}

function buildFiltersFrom(jobs) {
  const names = jobs.map(j => j.category?.name).filter(Boolean);
  const unique = [...new Set(names)];
  filtersDiv.innerHTML =
    `<button class="active" data-filter="__all">All</button>` +
    unique.map(n => `<button data-filter="${n.toLowerCase()}">${n}</button>`).join('');

  filtersDiv.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      filtersDiv.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyFilter(btn.dataset.filter);
    });
  });
}

// ===== Filter utilities =====
function currentFilterChoice() {
  const active = filtersDiv.querySelector('button.active');
  return active ? active.dataset.filter : '__all';
}

function applyFilter(choice) {
  const list = choice === '__all'
    ? allJobs
    : allJobs.filter(j => (j.category?.name || '').toLowerCase() === choice);
  renderGallery(list);
}

function addFilterIfMissing(catName) {
  const slug = (catName || '').toLowerCase();
  if (!slug) return;

  const exists = Array.from(filtersDiv.querySelectorAll('button'))
    .some(b => b.dataset.filter === slug);
  if (exists) return;

  const btn = document.createElement('button');
  btn.dataset.filter = slug;
  btn.textContent = catName;

  btn.addEventListener('click', () => {
    filtersDiv.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    applyFilter(slug);
  });

  filtersDiv.appendChild(btn);
}

// ===== Modal helpers =====
function fillModalThumbs(jobs) {
  thumbsContainer.innerHTML = '';
  jobs.forEach(job => {
    const fig = document.createElement('figure');
    fig.dataset.id = job.id;
    fig.innerHTML = `
      <img src="${job.imageUrl}" alt="${job.title}">
      <button class="delete-thumb" data-id="${job.id}" aria-label="Delete">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    `;
    thumbsContainer.append(fig);
  });

  // Wire deletes (remove from DOM after backend confirms)
  thumbsContainer.querySelectorAll('.delete-thumb').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = Number(btn.dataset.id);
      try {
        const res = await fetch(`http://localhost:5678/api/works/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        if (!res.ok) {
          alert('Failed to delete.');
          return;
        }
        // Update state
        allJobs = allJobs.filter(j => j.id !== id);
        // Remove from modal thumbs
        btn.closest('figure')?.remove();
        // Remove from main gallery without reload
        const mainFig = gallery.querySelector(`figure[data-id="${id}"]`);
        if (mainFig) mainFig.remove();
      } catch (e) {
        console.error(e);
        alert('Failed to delete.');
      }
    });
  });
}

function populateCategorySelectFrom(jobs) {
  categorySelect.innerHTML = '<option value="">Select category</option>';
  const seen = new Set();
  jobs.forEach(job => {
    const { id, name } = job.category || {};
    if (!id || !name) return;
    if (!seen.has(id)) {
      seen.add(id);
      const opt = document.createElement('option');
      opt.value = String(id);
      opt.textContent = name;
      categorySelect.append(opt);
    }
  });
}

// ===== Fetch initial works =====
async function fetchAndDisplayJobs() {
  try {
    const res = await fetch('http://localhost:5678/api/works');
    allJobs = await res.json();
    buildFiltersFrom(allJobs);
    renderGallery(allJobs);
  } catch (err) {
    console.error('Error fetching jobs:', err);
    filtersDiv.innerHTML = '';
    gallery.innerHTML = '<p style="color:#c00">Failed to load projects.</p>';
  }
}
fetchAndDisplayJobs();

// ===== Auth UI =====
const token = getToken();
const isAuthed = !!token;

// show/hide admin stuff
editBtn.style.display = isAuthed ? 'inline-flex' : 'none';
// show filters only when NOT logged in
filtersDiv.style.display = isAuthed ? 'none' : 'flex';

// Optional logout handler (only if you add #logout-btn in HTML)
if (logoutBtn) {
  logoutBtn.style.display = isAuthed ? 'inline-block' : 'none';
  logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('token');
    localStorage.removeItem('token');
    location.reload();
  });
}

// ===== Modal controls =====
function openModalGalleryView() {
  modal.style.display = 'flex';
  modal.setAttribute('data-view', 'gallery');
  titleEl.textContent = 'Photo Gallery';
  galleryView.style.display = 'block';
  addView.style.display = 'none';
  fillModalThumbs(allJobs);
}

function openModalAddView() {
  modal.setAttribute('data-view', 'add');
  titleEl.textContent = 'Add Photo';
  galleryView.style.display = 'none';
  addView.style.display = 'block';
  populateCategorySelectFrom(allJobs);
  form.reset();
  fileInput.value = ''; // allow re-upload of same file
  resetUploadPreview();
  updateConfirm();
}

editBtn.addEventListener('click', openModalGalleryView);
[backdrop, closeBtn].forEach(el =>
  el.addEventListener('click', () => {
    modal.style.display = 'none';
    resetUploadPreview(); // clean preview on close
  })
);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modal.style.display === 'flex') {
    modal.style.display = 'none';
    resetUploadPreview(); // clean preview on close
  }
});
openAddBtn.addEventListener('click', openModalAddView);
backBtn.addEventListener('click', openModalGalleryView);

// ===== Confirm button enablement =====
function updateConfirm() {
  const hasFile = fileInput.files && fileInput.files.length > 0;
  const titleOk = titleInput.value.trim().length > 0;
  const catOk   = !!categorySelect.value;
  confirmBtn.disabled = !(hasFile && titleOk && catOk);
}
['input', 'change'].forEach(evt => {
  form.addEventListener(evt, updateConfirm, true);
});
updateConfirm();

// ===== Upload API =====
async function uploadWork(file, title, categoryId) {
  const fd = new FormData();
  fd.append('image', file);
  fd.append('title', title);
  fd.append('category', String(categoryId));

  const auth = getToken();
  if (!auth) throw new Error('Not authenticated.');

  const res = await fetch('http://localhost:5678/api/works', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${auth}` },
    body: fd
  });

  if (!res.ok) {
    let errBody;
    try { errBody = await res.json(); }
    catch { errBody = await res.text(); }
    throw new Error(`Upload failed: ${typeof errBody === 'string' ? errBody : JSON.stringify(errBody)}`);
  }
  return await res.json();
}

// ===== Live preview logic =====
const uploadContainer = document.querySelector('.upload-container');
let previewImg = uploadContainer.querySelector('img.preview');
if (!previewImg) {
  previewImg = document.createElement('img');
  previewImg.className = 'preview';
  uploadContainer.appendChild(previewImg);
}

fileInput.addEventListener('change', () => {
  const file = fileInput.files?.[0];
  if (previewURL) {
    URL.revokeObjectURL(previewURL);
    previewURL = null;
  }
  if (file) {
    previewURL = URL.createObjectURL(file);
    previewImg.src = previewURL;
    previewImg.alt = file.name;
    uploadContainer.classList.add('has-preview');
  } else {
    resetUploadPreview();
  }
  updateConfirm();
});

function resetUploadPreview() {
  if (previewURL) {
    URL.revokeObjectURL(previewURL);
    previewURL = null;
  }
  previewImg.removeAttribute('src');
  previewImg.alt = '';
  uploadContainer.classList.remove('has-preview');
}

// ===== Submit handler =====
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const file = fileInput.files?.[0];
  if (!file) { alert('Please choose an image.'); return; }
  const isValidType = /^image\/(jpe?g|png)$/i.test(file.type);
  if (!isValidType) { alert('Only JPEG or PNG images are allowed.'); return; }
  const isValidSize = file.size <= 4 * 1024 * 1024;
  if (!isValidSize) { alert('Image must be 4 MB or smaller.'); return; }

  const title = titleInput.value.trim();
  const categoryId = Number(categorySelect.value);
  if (!title || !Number.isFinite(categoryId) || categoryId <= 0) {
    alert('Please complete all fields.');
    return;
  }

  confirmBtn.disabled = true;

  try {
    const activeFilter = currentFilterChoice();
    const newJob = await uploadWork(file, title, categoryId);

    const catName = categorySelect.options[categorySelect.selectedIndex].textContent;
    newJob.category = { id: categoryId, name: catName };
    allJobs.push(newJob);
    addFilterIfMissing(catName);
    applyFilter(activeFilter);

    const fig = document.createElement('figure');
    fig.dataset.id = newJob.id;
    fig.innerHTML = `
      <img src="${newJob.imageUrl}" alt="${newJob.title}">
      <button class="delete-thumb" data-id="${newJob.id}" aria-label="Delete">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    `;
    thumbsContainer.append(fig);

    // Wire delete for new thumb
    fig.querySelector('.delete-thumb').addEventListener('click', async () => {
      const id = Number(newJob.id);
      try {
        const res = await fetch(`http://localhost:5678/api/works/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        if (!res.ok) {
          alert('Failed to delete.');
          return;
        }
        allJobs = allJobs.filter(j => j.id !== id);
        fig.remove();
        const mainFig = gallery.querySelector(`figure[data-id="${id}"]`);
        if (mainFig) mainFig.remove();
      } catch (e2) {
        console.error(e2);
        alert('Failed to delete.');
      }
    });

    form.reset();
    fileInput.value = ''; // reset to allow same file again
    resetUploadPreview();
    updateConfirm();
    openModalGalleryView();

  } catch (err) {
    console.error(err);
    alert(err.message || 'Upload failed.');
  } finally {
    confirmBtn.disabled = false;
  }
});
