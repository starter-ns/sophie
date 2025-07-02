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

