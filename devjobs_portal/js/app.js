const jobList = document.querySelector('#job-list');
const searchJobs = document.querySelector('#search-jobs');
const locationFilter = document.querySelector('#location-filter');
const experienceFilter = document.querySelector('#experience-filter');
const typeFilter = document.querySelector('#type-filter');
const categoryFilter = document.querySelector('#category-filter');
const salaryFilter = document.querySelector('#salary-filter');
const sortJobs = document.querySelector('#sort-jobs');
const jobModal = document.querySelector('#job-modal');
const applicationModal = document.querySelector('#application-modal');
const details = document.querySelector('#job-details');
const bookmarkedJobs = JSON.parse(localStorage.getItem('devJobBookmarks')) || [];
const jobs = Array.from({ length: 30 }, (_, index) => ({
    id: index + 1,
    title: ['Frontend Developer', 'JavaScript Developer', 'Full Stack Developer'][index % 3],
    company: ['Northstar Labs', 'Bright Pixel', 'River Tech'][index % 3],
    location: ['Remote', 'Hybrid', 'Onsite'][index % 3],
    experience: ['Junior', 'Mid', 'Senior'][index % 3],
    type: ['Full-time', 'Part-time', 'Contract'][index % 3],
    category: ['Frontend', 'Backend', 'Full Stack'][index % 3],
    salary: 55000 + index * 2500,
    skills: ['HTML, CSS, JavaScript']
}));
let selectedJob = null;
let currentPage = 1;
let applicationStep = 1;
let showingBookmarks = false;

function resetApplication() {
    applicationStep = 1;
    document.querySelector('#application-form').reset();
    document.querySelectorAll('.step').forEach((step) => step.classList.toggle('hidden', step.dataset.step !== '1'));
    document.querySelector('#next-step').classList.remove('hidden');
    document.querySelector('#submit-application').classList.add('hidden');
    document.querySelector('#application-form').classList.remove('hidden');
    document.querySelector('#application-success').classList.add('hidden');
}

function filteredJobs() {
    const term = searchJobs.value.toLowerCase().trim();
    const result = jobs.filter((job) => {
        const textMatch = `${job.title} ${job.company} ${job.skills}`.toLowerCase().includes(term);
        const bookmarkMatch = !showingBookmarks || bookmarkedJobs.includes(job.id);
        const salaryMatch = salaryFilter.value === 'all' || (salaryFilter.value === 'low' ? job.salary < 80000 : job.salary >= 80000);
        return textMatch && bookmarkMatch && salaryMatch && (locationFilter.value === 'all' || job.location === locationFilter.value) && (experienceFilter.value === 'all' || job.experience === experienceFilter.value) && (typeFilter.value === 'all' || job.type === typeFilter.value) && (categoryFilter.value === 'all' || job.category === categoryFilter.value);
    });
    return result.sort((a, b) => sortJobs.value === 'high' ? b.salary - a.salary : sortJobs.value === 'low' ? a.salary - b.salary : sortJobs.value === 'az' ? a.title.localeCompare(b.title) : b.id - a.id);
}

function renderJobs() {
    const results = filteredJobs();
    const pageItems = results.slice((currentPage - 1) * 10, currentPage * 10);
    jobList.innerHTML = pageItems.length ? pageItems.map((job) => `
        <article class="job-card"><img class="company-logo" src="https://ui-avatars.com/api/?name=${encodeURIComponent(job.company)}&background=d9e8ee&color=18324a" alt="${job.company} logo"><div><h3>${job.title}</h3><p>${job.company} | ${job.location} | ${job.experience}</p><p>${job.type} | $${job.salary.toLocaleString()} | ${job.skills}</p></div><div class="job-actions"><button data-action="save" data-id="${job.id}" type="button">${bookmarkedJobs.includes(job.id) ? 'Saved' : 'Save'}</button><button data-action="details" data-id="${job.id}" type="button">View details</button><button data-action="apply" data-id="${job.id}" type="button">Apply</button></div></article>`).join('') : '<p>No jobs found.</p>';
    const pages = Math.ceil(results.length / 10);
    document.querySelector('#pagination').innerHTML = Array.from({ length: pages }, (_, index) => `<button type="button" data-page="${index + 1}">${index + 1}</button>`).join('');
}

jobList.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    const job = jobs.find((item) => item.id === Number(button.dataset.id));
    if (button.dataset.action === 'save') {
        const index = bookmarkedJobs.indexOf(job.id);
        index === -1 ? bookmarkedJobs.push(job.id) : bookmarkedJobs.splice(index, 1);
        localStorage.setItem('devJobBookmarks', JSON.stringify(bookmarkedJobs));
        renderJobs();
    } else {
        selectedJob = job;
        const recentlyViewed = JSON.parse(localStorage.getItem('devJobRecentlyViewed')) || [];
        localStorage.setItem('devJobRecentlyViewed', JSON.stringify([job.id, ...recentlyViewed.filter((id) => id !== job.id)].slice(0, 5)));
        details.innerHTML = `<h2>${job.title}</h2><p>${job.company}, ${job.location}</p><p>Experience: ${job.experience} | Category: ${job.category}</p><p>Responsibilities: build and improve customer-facing web features.</p><p>Requirements: ${job.skills}, teamwork, and problem solving.</p><p>Benefits: mentoring, flexible work, and learning support.</p><p>Salary: $${job.salary.toLocaleString()}</p>`;
        jobModal.classList.remove('hidden');
        if (button.dataset.action === 'apply') document.querySelector('#apply-button').click();
    }
});

document.querySelector('#pagination').addEventListener('click', (event) => { currentPage = Number(event.target.dataset.page); renderJobs(); });
document.querySelector('#bookmarks-button').addEventListener('click', () => { showingBookmarks = !showingBookmarks; currentPage = 1; document.querySelector('#bookmarks-button').textContent = showingBookmarks ? 'All jobs' : 'Bookmarks'; renderJobs(); });
document.querySelectorAll('.close').forEach((button) => button.addEventListener('click', () => { jobModal.classList.add('hidden'); applicationModal.classList.add('hidden'); }));
document.querySelector('#apply-button').addEventListener('click', () => { jobModal.classList.add('hidden'); resetApplication(); applicationModal.classList.remove('hidden'); });
document.querySelector('#next-step').addEventListener('click', () => {
    const currentStep = document.querySelector(`[data-step="${applicationStep}"]`);
    const requiredFields = [...currentStep.querySelectorAll('input, select')];
    const invalidField = requiredFields.find((field) => !field.checkValidity());
    if (invalidField) {
        invalidField.reportValidity();
        return;
    }
    currentStep.classList.add('hidden');
    applicationStep += 1;
    const nextStep = document.querySelector(`[data-step="${applicationStep}"]`);
    nextStep.classList.remove('hidden');
    if (applicationStep === 4) {
        const data = new FormData(document.querySelector('#application-form'));
        document.querySelector('#application-review').innerHTML = `<p>${data.get('name')} | ${data.get('email')} | ${data.get('phone')}</p><p>${data.get('experience')} | ${data.get('skills')}</p><p>${data.get('portfolio')} | ${data.get('linkedin')}</p><p>Resume and cover letter selected.</p>`;
        document.querySelector('#next-step').classList.add('hidden');
        document.querySelector('#submit-application').classList.remove('hidden');
    }
});
document.querySelector('#application-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const resume = event.target.elements.resume.files[0];
    const coverLetter = event.target.elements.coverLetter.files[0];
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!resume || !coverLetter || !allowedTypes.includes(resume.type) || !allowedTypes.includes(coverLetter.type) || resume.size > 5 * 1024 * 1024 || coverLetter.size > 5 * 1024 * 1024) {
        alert('Please choose a PDF, DOC, or DOCX file under 5 MB.');
        return;
    }
    const applications = JSON.parse(localStorage.getItem('devJobApplications')) || [];
    applications.push({ jobId: selectedJob.id, submittedAt: new Date().toISOString() });
    localStorage.setItem('devJobApplications', JSON.stringify(applications));
    const applicationId = `APP-${Date.now()}`;
    const success = document.querySelector('#application-success');
    document.querySelector('#application-form').classList.add('hidden');
    success.innerHTML = `<h2>Application submitted successfully</h2><p>Application ID: ${applicationId}</p><p>Applied date: ${new Date().toLocaleDateString()}</p>`;
    success.classList.remove('hidden');
    applicationModal.classList.add('hidden');
});
[searchJobs, locationFilter, experienceFilter, typeFilter, categoryFilter, salaryFilter, sortJobs].forEach((control) => control.addEventListener('input', () => { currentPage = 1; renderJobs(); }));
jobList.innerHTML = '<p class="skeleton">Loading jobs...</p>';
setTimeout(renderJobs, 250);
