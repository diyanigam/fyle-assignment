let currentPage = 1;
let repositoriesPerPage = 10;
let totalRepositories = 0;

async function searchRepositories() {
    const username = document.getElementById('usernameInput').value;

    if (username.trim() === "") {
        alert("Please enter a GitHub username.");
        return;
    }

    showLoader();

    try {
        const user = await fetch(`https://api.github.com/users/${username}`).then(response => response.json());
        displayUserInfo(user);

        const repositories = await fetchRepositories(user.repos_url);
        totalRepositories = repositories.length;
        hideLoader();

        displayRepositories(repositories);
        displayPagination();
    } catch (error) {
        hideLoader();
        alert('Error fetching user information or repositories. Please try again.');
    }
}

async function fetchRepositories(reposUrl) {
    let allRepositories = [];
    let page = 1;

    try {
        showLoader();

        while (true) {
            const pageParam = `per_page=${repositoriesPerPage}&page=${page}`;
            const apiUrl = `${reposUrl}?${pageParam}`;

            const response = await fetch(apiUrl);
            const repositories = await response.json();

            if (repositories.length === 0) {
                break;
            }

            allRepositories = [...allRepositories, ...repositories];

            const linkHeader = response.headers.get('Link');
            if (!linkHeader || !linkHeader.includes('rel="next"')) {
                break;
            }

            page++;
        }

        hideLoader(); 

        return allRepositories;
    } catch (error) {
        hideLoader();
        console.error('Error fetching repositories:', error);
        return [];
    }
}

async function displayUserInfo(user) {
    const userInfoSection = document.getElementById('user-info');
    userInfoSection.style.display = 'block';
    userInfoSection.innerHTML = '';

    const userCard = document.createElement('div');
    userCard.classList.add('user-card');

    userCard.innerHTML = `
        <img src="${user.avatar_url}" alt="Profile Image">
        <div class="user-info-details">
            <h2>${user.name || user.login}</h2>
            <p>${user.bio || 'No bio available.'}</p>
            <p><strong>Location:</strong> ${user.location || 'Not specified'}</p>
            ${user.blog ? `<p><strong>Blog:</strong> <a href="${user.blog}" target="_blank">${user.blog}</a></p>` : ''}
            <p><strong>GitHub:</strong> <a href="${user.html_url}" target="_blank">${user.login}</a></p>
        </div>
    `;

    userInfoSection.appendChild(userCard);
}

async function displayRepositories(repositories) {
    const repositoriesContainer = document.getElementById('repositories');
    repositoriesContainer.style.display = 'block';
    repositoriesContainer.innerHTML = '';

    const repositoriesDiv = document.createElement('div');
    repositoriesDiv.classList.add('repositories-container');

    for (const repository of repositories) {
        const repositoryCard = document.createElement('div');
        repositoryCard.classList.add('repository-card');

        repositoryCard.innerHTML = `
            <h3><a href="${repository.html_url}" target="_blank">${repository.name}</a></h3>
            <p>${repository.description || 'No description available.'}</p>
            <p><strong>Language:</strong></p>
            <div class="languages-container">
                ${await getRepositoryLanguages(repository.languages_url)}
            </div>
            <p><strong>Stars:</strong> ${repository.stargazers_count}</p>
            <p><strong>Forks:</strong> ${repository.forks_count}</p>
        `;

        repositoriesDiv.appendChild(repositoryCard);
    }

    repositoriesContainer.appendChild(repositoriesDiv);
}

async function getRepositoryLanguages(languagesUrl) {
    try {
        const response = await fetch(languagesUrl);
        const languages = await response.json();

        return Object.keys(languages).map(language => `<div class="language-box">${language}</div>`).join('');
    } catch (error) {
        console.error('Error fetching repository languages:', error);
        return '';
    }
}

function showLoader() {
    const loader = document.getElementById('loader');
    loader.style.display = 'block';
}

function hideLoader() {
    const loader = document.getElementById('loader');
    loader.style.display = 'none';
}

async function displayPagination() {
    const paginationContainer = document.getElementById('pagination');
    paginationContainer.style.display = 'block';
    paginationContainer.innerHTML = '';

    const totalPages = Math.ceil(totalRepositories / repositoriesPerPage);

    for (let i = 1; i <= totalPages; i++) {
        const button = document.createElement('button');
        button.classList.add('pagination-button');
        button.textContent = i;
        button.addEventListener('click', () => handlePaginationClick(i));
        paginationContainer.appendChild(button);
    }
}

function handlePaginationClick(page) {
    currentPage = page;
    searchRepositories();
}
