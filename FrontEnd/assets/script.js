async function fetchAndDisplayJobs() {
  const response = await fetch('http://localhost:5678/api/works');
  const jobs = await response.json();

  const gallery = document.querySelector('.gallery');
  gallery.innerHTML = '';

  jobs.forEach(job => {
    const figure = document.createElement('figure');

    const img = document.createElement('img');
    img.src = job.imageUrl;
    img.alt = job.title;

    const caption = document.createElement('figcaption');
    caption.textContent = job.title;

    figure.appendChild(img);
    figure.appendChild(caption);
    gallery.appendChild(figure);
  });
}

fetchAndDisplayJobs();

const filterButtons = document.querySelectorAll('.filters button');

filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    // Remove .active from all buttons
    filterButtons.forEach(btn => btn.classList.remove('active'));

    // Add .active to the clicked button
    button.classList.add('active');

    // Now you can filter content here if needed
    console.log(`Filter clicked: ${button.textContent}`);
  });
});
