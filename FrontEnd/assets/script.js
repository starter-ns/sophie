// 1. Grab DOM references
const gallery = document.querySelector('.gallery');
const filterButtons = document.querySelectorAll('.filters button');

// 2. Will hold the full list of jobs
let allJobs = [];

// 3. Fetch & initialize
async function fetchAndDisplayJobs() {
  try {
    const res = await fetch('http://localhost:5678/api/works');
    allJobs = await res.json();
    renderGallery(allJobs);
  } catch (err) {
    console.error('Error fetching jobs:', err);
  }
}

// 4. Renders a given list of jobs into the gallery
function renderGallery(jobs) {
  gallery.innerHTML = '';
  jobs.forEach(({ title, imageUrl }) => {
    const figure = document.createElement('figure');
    figure.innerHTML = `
      <img src="${imageUrl}" alt="${title}">
      <figcaption>${title}</figcaption>
    `;
    gallery.appendChild(figure);
  });
}

// 5. Wire up filter buttons
filterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    // 5a. Update active class
    filterButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // 5b. Determine filter and re-render
    const filter = btn.textContent.toLowerCase();
    if (filter === 'all') {
      renderGallery(allJobs);
    } else {
      const filtered = allJobs.filter(job =>
        job.category.name.toLowerCase() === filter
      );
      renderGallery(filtered);
    }
  });
});

// 6. Run on load
fetchAndDisplayJobs();
