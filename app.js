const CONFIG = {
    MANIFEST_PATH: "./structure.json",
    WELCOME: "A centralized resource for spine imaging measurements."
};

const viewContainer = document.getElementById('view-container');
const breadcrumb = document.getElementById('breadcrumb');
const backBtn = document.getElementById('back-btn');
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');
const brandRow = document.getElementById('brand-row');

let db = null;
let stateStack = [];
let searchIndex = [];

window.onpopstate = () => {
    if (stateStack.length > 0) {
        stateStack.pop();
        render();
    }
};

async function init() {
    try {
        const res = await fetch(CONFIG.MANIFEST_PATH);
        if (!res.ok) throw new Error("Could not fetch structure.json.");
        db = await res.json();
        buildSearchIndex(db);
        resetToHome();
    } catch (e) {
        viewContainer.innerHTML = `<div class="status-msg">Error: ${e.message}</div>`;
    }
}

function buildSearchIndex(data) {
    searchIndex = [];
    Object.keys(data).forEach(cat => {
        Object.keys(data[cat]).forEach(mod => {
            const gridData = data[cat][mod];
            if (gridData.content && gridData.content.length > 0) {
                gridData.content.forEach(itemName => {
                    searchIndex.push({
                        category: cat, modality: mod,
                        path: gridData.path, itemName: itemName
                    });
                });
            }
        });
    });
}

function fuzzySearch(query) {
    if (!query) return [];
    const pattern = query.split('').map(char => char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*?');
    const regex = new RegExp(pattern, 'i');
    return searchIndex.filter(item => regex.test(item.itemName));
}

searchInput.addEventListener('focus', () => brandRow.classList.add('search-active'));
searchInput.addEventListener('blur', () => {
    setTimeout(() => {
        brandRow.classList.remove('search-active');
        searchResults.style.display = 'none';
    }, 250);
});

searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    if (query.length === 0) {
        searchResults.style.display = 'none';
        return;
    }
    displaySearchResults(fuzzySearch(query));
});

function displaySearchResults(matches) {
    searchResults.innerHTML = '';
    if (matches.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'search-item';
        empty.innerHTML = '<strong style="color: #94a3b8; text-align: center;">No results found</strong>';
        searchResults.appendChild(empty);
    } else {
        matches.forEach(match => {
            const div = document.createElement('div');
            div.className = 'search-item';
            div.innerHTML = `<strong>${match.itemName}</strong><small>${match.category} &rsaquo; ${match.modality}</small>`;
            div.onclick = () => {
                searchResults.style.display = 'none';
                searchInput.value = '';
                loadSearchItem(match);
            };
            searchResults.appendChild(div);
        });
    }
    searchResults.style.display = 'block';
}

function resetToHome() {
    stateStack = [];
    render();
}

function goBack() { window.history.back(); }

function updateUI(titlePath) {
    breadcrumb.innerText = titlePath.length > 0 ? titlePath.join(' > ') : CONFIG.WELCOME;
    backBtn.style.display = stateStack.length > 0 ? 'block' : 'none';
    window.scrollTo(0, 0);
}

function getRelPath(p) {
    return `./${p.startsWith('/') ? p.substring(1) : p}`;
}

function render() {
    const current = stateStack[stateStack.length - 1];
    const titlePath = stateStack.map(s => s.label);
    viewContainer.innerHTML = '';
    
    if (current && (current.type === 'grid' || current.type === 'content')) {
        document.body.classList.add('no-bg');
    } else {
        document.body.classList.remove('no-bg');
    }

    if (stateStack.length === 0) {
        viewContainer.className = 'centered';
        const list = document.createElement('div');
        list.className = 'menu-list';
        Object.keys(db).forEach(cat => {
            const hasContent = Object.values(db[cat]).some(mod => mod.content && mod.content.length > 0);
            if (hasContent) {
                const btn = document.createElement('button');
                btn.className = 'menu-item';
                btn.innerText = cat;
                btn.onclick = () => {
                    stateStack.push({ type: 'category', label: cat, data: db[cat] });
                    history.pushState({ depth: stateStack.length }, cat);
                    render();
                };
                list.appendChild(btn);
            }
        });
        viewContainer.appendChild(list);
        updateUI([]);
    }
    else if (current.type === 'category') {
        viewContainer.className = 'centered';
        const list = document.createElement('div');
        list.className = 'menu-list';
        Object.keys(current.data).forEach(mod => {
            if (current.data[mod].content && current.data[mod].content.length > 0) {
                const btn = document.createElement('button');
                btn.className = 'menu-item';
                btn.innerText = mod;
                btn.onclick = () => {
                    stateStack.push({ type: 'grid', label: mod, data: current.data[mod] });
                    history.pushState({ depth: stateStack.length }, mod);
                    render();
                };
                list.appendChild(btn);
            }
        });
        viewContainer.appendChild(list);
        updateUI(titlePath);
    }
    else if (current.type === 'grid') {
        viewContainer.className = '';
        const base = getRelPath(current.data.path);
        current.data.content.forEach(itemName => {
            const card = document.createElement('div');
            card.className = 'item-card';
            card.innerHTML = `<img src="${base}${itemName}/thumbnail.png" onerror="this.style.display='none'"><div class="label">${itemName}</div>`;
            card.onclick = () => loadItem(current.data.path, itemName);
            viewContainer.appendChild(card);
        });
        updateUI(titlePath);
    }
    else if (current.type === 'content') {
        viewContainer.className = '';
        viewContainer.innerHTML = `<div id="content-viewer" class="inline-html-content" style="display:block">${current.html}</div>`;
        updateUI(titlePath);
    }
}

async function loadItem(rawPath, itemName) {
    try {
        const baseDir = getRelPath(rawPath);
        const res = await fetch(`${baseDir}${itemName}/index.html`);
        let html = await res.text();
        const itemFolder = `${baseDir}${itemName}/`;
        html = html.replace(/src=["'](?:\.\/)?images\/(.*?)["']/g, (m, f) => `src="${itemFolder}images/${f}"`);
        stateStack.push({ type: 'content', label: itemName, html: html });
        history.pushState({ depth: stateStack.length }, itemName);
        render();
    } catch (e) { alert("Document unavailable."); }
}

async function loadAbout() {
    try {
        const res = await fetch('about.html');
        if (!res.ok) throw new Error();
        let html = await res.text();
        
        // Reset the stack so About is treated as a primary view
        stateStack = [{ type: 'content', label: 'About', html: html }];
        
        // Use pushState to allow the hardware back button to return home
        history.pushState({ depth: stateStack.length }, 'About');
        render();
    } catch (e) {
        alert("About page unavailable.");
    }
}

async function loadSearchItem(match) {
    try {
        const baseDir = getRelPath(match.path);
        const res = await fetch(`${baseDir}${match.itemName}/index.html`);
        let html = await res.text();
        const itemFolder = `${baseDir}${match.itemName}/`;
        html = html.replace(/src=["'](?:\.\/)?images\/(.*?)["']/g, (m, f) => `src="${itemFolder}images/${f}"`);
        stateStack = [
            { type: 'category', label: match.category, data: db[match.category] },
            { type: 'grid', label: match.modality, data: db[match.category][match.modality] },
            { type: 'content', label: match.itemName, html: html }
        ];
        render();
    } catch (e) { alert("Document unavailable."); }
}

init();
