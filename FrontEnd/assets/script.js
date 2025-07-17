// 1) Grab DOM references
const gallery = document.querySelector('.gallery');
const filtersDiv = document.querySelector('.filters');

let allJobs = [];

// 2) Fetch, build filters, and render
async function fetchAndDisplayJobs() {
  try {
    // Fetch all projects
    const res = await fetch('http://localhost:5678/api/works');
    allJobs = await res.json();  // array of { id, title, imageUrl, category: { name } }

    // Build dynamic filter buttons
    const categoryNames = allJobs.map(job => job.category.name);
    const uniqueNames = [...new Set(categoryNames)];
    filtersDiv.innerHTML =
      `<button class="active">All</button>` +
      uniqueNames.map(name => `<button>${name}</button>`).join('');

    // Wire up each filter button
    const filterButtons = filtersDiv.querySelectorAll('button');
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        // Highlight active
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Filter data
        const choice = btn.textContent.toLowerCase();
        const toShow =
          choice === 'all'
            ? allJobs
            : allJobs.filter(j => j.category.name.toLowerCase() === choice);

        renderGallery(toShow);
      });
    });

    // Initial render (All)
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

// Grab new DOM elements
const editBtn      = document.getElementById('open-edit-mode');
const modal        = document.getElementById('admin-modal');
const backdrop     = modal.querySelector('.modal-backdrop');
const closeBtn     = document.getElementById('modal-close');
const backBtn      = document.getElementById('back-to-gallery');
const galleryView  = document.getElementById('view-gallery');
const addView      = document.getElementById('view-add');
const openAddBtn   = document.getElementById('open-add-view');
const thumbsContainer = document.querySelector('.modal-thumbs');
const titleEl      = document.getElementById('modal-title');
const fileInput    = document.getElementById('photo-input');
const form         = document.getElementById('add-photo-form');

// 1) Show Edit button when logged in
if (localStorage.getItem('token')) {
  editBtn.style.display = 'inline-flex';
}

// 2) Open in gallery view
editBtn.addEventListener('click', () => {
  modal.style.display          = 'flex';
  modal.setAttribute('data-view','gallery');
  titleEl.textContent          = 'Photo Gallery';
  galleryView.style.display    = 'block';
  addView.style.display        = 'none';

  // populate thumbnails
  thumbsContainer.innerHTML = '';
  allJobs.forEach(job => {
    const fig = document.createElement('figure');
    fig.innerHTML = `
      <img src="${job.imageUrl}" alt="${job.title}">
      <button class="delete-thumb" data-id="${job.id}"><i class="fa-solid fa-trash-can"></i></button>
    `;
    thumbsContainer.append(fig);
  });
  // wire delete buttons
  thumbsContainer.querySelectorAll('.delete-thumb').forEach(btn => {
    btn.addEventListener('click', async e => {
      const id = e.currentTarget.dataset.id;
      await fetch(`http://localhost:5678/api/works/${id}`, {
        method: 'DELETE',
        headers: { Authorization:`Bearer ${localStorage.getItem('token')}` }
      });
      // remove from array & re-render
      allJobs = allJobs.filter(j=>j.id!=id);
      e.currentTarget.closest('figure').remove();
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
  titleEl.textContent   = 'Add Photo';
  galleryView.style.display = 'none';
  addView.style.display     = 'block';

  // populate category dropdown
  const select = document.getElementById('category-select');
  select.innerHTML = '<option value=""></option>';
  [...new Set(allJobs.map(j=>j.category.name))].forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat; opt.textContent = cat;
    select.append(opt);
  });
});

// 5) Back to gallery view
backBtn.addEventListener('click', () => {
  modal.setAttribute('data-view','gallery');
  titleEl.textContent       = 'Photo Gallery';
  galleryView.style.display = 'block';
  addView.style.display     = 'none';
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
    headers: { Authorization:`Bearer ${localStorage.getItem('token')}` },
    body: fd
  });
  const newJob = await res.json();
  allJobs.push(newJob);

  // Immediately add to gallery & modal thumbs
  renderGallery(allJobs);
  openAddBtn.click();   // back to gallery view
});
