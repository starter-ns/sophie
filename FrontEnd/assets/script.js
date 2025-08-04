// 1) Grab DOM references
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
const fileInput       = document.getElementById('photo-input');
const form            = document.getElementById('add-photo-form');
const titleInput      = document.getElementById('title-input');
const categorySelect  = document.getElementById('category-select');
const confirmBtn      = document.querySelector('.btn-confirm');

// 2) Toggle Confirm button enabled state
function updateConfirm() {
  const ready =
    fileInput.files.length > 0 &&
    titleInput.value.trim() !== '' &&
    categorySelect.value !== '';
  confirmBtn.disabled = !ready;
}
[titleInput, categorySelect].forEach(el =>
  el.addEventListener('input', updateConfirm)
);
fileInput.addEventListener('change', updateConfirm);


// 3) In-memory store of jobs
let allJobs = [];

// 4) Fetch & render main gallery + filters
async function fetchAndDisplayJobs() {
  try {
    const res = await fetch('http://localhost:5678/api/works');
    allJobs = await res.json();
    // Build filter buttons
    const names = allJobs.map(j => j.category.name);
    const unique = [...new Set(names)];
    filtersDiv.innerHTML =
      `<button class="active">All</button>` +
      unique.map(n => `<button>${n}</button>`).join('');
    filtersDiv.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        filtersDiv.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const choice = btn.textContent.toLowerCase();
        const list = choice === 'all'
          ? allJobs
          : allJobs.filter(j => j.category.name.toLowerCase() === choice);
        renderGallery(list);
      });
    });
    renderGallery(allJobs);
  } catch (err) {
    console.error('Error fetching jobs:', err);
  }
}
function renderGallery(jobs) {
  gallery.innerHTML = '';
  jobs.forEach(({ imageUrl, title }) => {
    const fig = document.createElement('figure');
    fig.innerHTML = `
      <img src="${imageUrl}" alt="${title}">
      <figcaption>${title}</figcaption>
    `;
    gallery.appendChild(fig);
  });
}
fetchAndDisplayJobs();

// 5) Modal controls

// Show Edit only if logged in
if (localStorage.getItem('token')) {
  editBtn.style.display = 'inline-flex';
}

// Open modal gallery view
editBtn.addEventListener('click', () => {
  modal.style.display        = 'flex';
  modal.setAttribute('data-view','gallery');
  titleEl.textContent        = 'Photo Gallery';
  galleryView.style.display  = 'block';
  addView.style.display      = 'none';

  // Fill thumbnails
  thumbsContainer.innerHTML = '';
  allJobs.forEach(job => {
    const fig = document.createElement('figure');
    fig.innerHTML = `
      <img src="${job.imageUrl}" alt="${job.title}">
      <button class="delete-thumb" data-id="${job.id}">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    `;
    thumbsContainer.append(fig);
  });

  // Wire deletes
  thumbsContainer.querySelectorAll('.delete-thumb').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      await fetch(`http://localhost:5678/api/works/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      allJobs = allJobs.filter(j => j.id !== Number(id));
      btn.closest('figure').remove();
      renderGallery(allJobs);
    });
  });
});

// Close modal
[backdrop, closeBtn].forEach(el =>
  el.addEventListener('click', () => modal.style.display = 'none')
);

// Switch to Add view
openAddBtn.addEventListener('click', () => {
  modal.setAttribute('data-view','add');
  titleEl.textContent       = 'Add Photo';
  galleryView.style.display = 'none';
  addView.style.display     = 'block';

  // Populate category selector with IDs
  categorySelect.innerHTML = '<option value="">Select category</option>';
  const seen = new Set();
  allJobs.forEach(job => {
    const { id, name } = job.category;
    if (!seen.has(id)) {
      seen.add(id);
      const opt = document.createElement('option');
      opt.value       = id;   // numeric ID
      opt.textContent = name; // display name
      categorySelect.append(opt);
    }
  });
});

// Back to gallery
backBtn.addEventListener('click', () => {
  modal.setAttribute('data-view','gallery');
  titleEl.textContent       = 'Photo Gallery';
  galleryView.style.display = 'block';
  addView.style.display     = 'none';
});

// 6) uploadWork helper
async function uploadWork(file, title, categoryId) {
  const formData = new FormData();
    console.log(formData)
  formData.append('image', file);
  formData.append('title', title);
  formData.append('categoryId', categoryId);

  const token = localStorage.getItem('token');
  if (!token) throw new Error('Not authenticated.');

  const res = await fetch('http://localhost:5678/api/works', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
  if (!res.ok) {
    let errBody;
    try { errBody = await res.json(); }
    catch { errBody = await res.text(); }
    throw new Error(`Upload failed: ${JSON.stringify(errBody)}`);
  }
  return await res.json();
}

// 7) Handle Add-Photo submit
form.addEventListener('submit', async e => {
  e.preventDefault();
  try {
    const file       = fileInput.files[0];
    const title      = titleInput.value.trim();
    const categoryId = parseInt(categorySelect.value, 10);

    console.log('🔼 Uploading:', { title, categoryId, fileName: file.name });
    const newJob = await uploadWork(file, title, categoryId);
    console.log('✅ Uploaded:', newJob);

    // Update UI
    allJobs.push(newJob);
    renderGallery(allJobs);
    editBtn.click();
    form.reset();
    confirmBtn.disabled = true;
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
});
