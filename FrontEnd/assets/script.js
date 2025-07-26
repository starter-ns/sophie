// 1) Grab DOM references
const gallery = document.querySelector('.gallery');
const filtersDiv = document.querySelector('.filters');

let allJobs = [];

// 2) Fetch, build filters, and render
async function fetchAndDisplayJobs() {
  try {
    const res = await fetch('http://localhost:5678/api/works');
    allJobs = await res.json();

    // Build filter buttons
    const categoryNames = allJobs.map(job => job.category.name);
    const uniqueNames = [...new Set(categoryNames)];
    filtersDiv.innerHTML =
      `<button class="active">All</button>` +
      uniqueNames.map(name => `<button>${name}</button>`).join('');

    // Wire up filter clicks
    filtersDiv.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        filtersDiv.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const choice = btn.textContent.toLowerCase();
        const toShow = choice === 'all'
          ? allJobs
          : allJobs.filter(j => j.category.name.toLowerCase() === choice);
        renderGallery(toShow);
      });
    });

    renderGallery(allJobs);
  } catch (err) {
    console.error('Error fetching jobs:', err);
  }
}

// 3) Render helper
function renderGallery(jobs) {
  gallery.innerHTML = '';
  jobs.forEach(({ imageUrl, title }) => {
    const figure = document.createElement('figure');
    figure.innerHTML = `
      <img src="${imageUrl}" alt="${title}">
      <figcaption>${title}</figcaption>
    `;
    gallery.appendChild(figure);
  });
}

// 4) Kick it off
fetchAndDisplayJobs();

// ——— Modal Controls & View Logic ———

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

// 1) Show Edit button only if logged in
if (localStorage.getItem('token')) {
  editBtn.style.display = 'inline-flex';
}

// 2) Open in gallery view
editBtn.addEventListener('click', () => {
  modal.style.display        = 'flex';
  modal.setAttribute('data-view','gallery');
  titleEl.textContent        = 'Photo Gallery';
  galleryView.style.display  = 'block';
  addView.style.display      = 'none';

  // Populate thumbnails
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

  // Wire up simple delete on each button
  thumbsContainer.querySelectorAll('.delete-thumb').forEach(btn => {
    btn.addEventListener('click', async e => {
      const id = btn.dataset.id;
      const token = localStorage.getItem('token');

      // Send DELETE
      await fetch(`http://localhost:5678/api/works/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Update data & UI
      allJobs = allJobs.filter(job => job.id !== Number(id));
      btn.closest('figure').remove();
      renderGallery(allJobs);
    });
  });
});

// 3) Close modal
[backdrop, closeBtn].forEach(el =>
  el.addEventListener('click', () => modal.style.display = 'none')
);

// 4) Switch to Add view
openAddBtn.addEventListener('click', () => {
  modal.setAttribute('data-view','add');
  titleEl.textContent        = 'Add Photo';
  galleryView.style.display  = 'none';
  addView.style.display      = 'block';

  const select = document.getElementById('category-select');
  select.innerHTML = '<option value="">Select category</option>';
  [...new Set(allJobs.map(j => j.category.name))].forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    select.append(opt);
  });
});

// 5) Back to gallery view
backBtn.addEventListener('click', () => {
  modal.setAttribute('data-view','gallery');
  titleEl.textContent        = 'Photo Gallery';
  galleryView.style.display  = 'block';
  addView.style.display      = 'none';
});

// 6) Handle new photo submissions
form.addEventListener('submit', async e => {
  e.preventDefault();
  const fd = new FormData();
  fd.append('image', fileInput.files[0]);
  fd.append('title', document.getElementById('title-input').value);
  fd.append('category', document.getElementById('category-select').value);

  const res = await fetch('http://localhost:5678/api/works', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
    body: fd
  });
  const newJob = await res.json();
  allJobs.push(newJob);

  renderGallery(allJobs);
  openAddBtn.click();
});
