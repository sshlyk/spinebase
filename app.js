const CONFIG = {
    MANIFEST_PATH: "./structure.json",
    WELCOME: "A centralized resource for spine imaging measurements."
};

const app = document.getElementById('app');
const viewContainer = document.getElementById('view-container');
const breadcrumb = document.getElementById('breadcrumb');
const backBtn = document.getElementById('back-btn');

let db = null;
let stateStack = [];

// Handle Browser Back Button
window.onpopstate = () => {
    if (stateStack.length > 0) {
        stateStack.pop();
        render();
    }
};

async function init() {
    app.style.backgroundImage = "url('./assets/spine-background.png')";
    try {
        const res = await fetch(CONFIG.MANIFEST_PATH);
        if (!res.ok) throw new Error("Could not fetch structure.json. Please run via local server.");
        db = await res.json();
        resetToHome();
    } catch (e) {
        viewContainer.innerHTML = `<div class="status-msg">Error: ${e.message}</div>`;
    }
}

function resetToHome() {
    stateStack = [];
    render();
}

function goBack() { window.history.back(); }

async function showAboutUs() {
    try {
        const res = await fetch('./about.html');
        const html = await res.text();
        stateStack.push({ type: 'about', label: 'About Us', html: html });
        history.pushState({ depth: stateStack.length }, "About Us");
        render();
    } catch (e) {
        alert("About page could not be loaded.");
    }
}

function updateUI(titlePath, isClinical = false) {
    breadcrumb.innerText = titlePath.length > 0 ? titlePath.join(' > ') : CONFIG.WELCOME;
    backBtn.style.display = stateStack.length > 0 ? 'block' : 'none';
    
    if (isClinical) {
        document.body.classList.add('clinical-mode');
    } else {
        document.body.classList.remove('clinical-mode');
    }
    
    // Bulletproof Scroll Reset
    window.scrollTo(0, 0); 
    document.body.scrollTop = 0; 
    document.documentElement.scrollTop = 0; 
}

function getRelPath(p) {
    let clean = p.startsWith('/') ? p.substring(1) : p;
    return `./${clean}`;
}

function render() {
    const depth = stateStack.length;
    const current = stateStack[depth - 1];
    const titlePath = stateStack.map(s => s.label);
    
    viewContainer.innerHTML = '';
    viewContainer.style.display = 'block';

    if (depth === 0) {
        viewContainer.classList.add('centered');
        const list = document.createElement('div');
        list.className = 'menu-list';
        Object.keys(db).forEach(cat => {
            const btn = document.createElement('button');
            btn.className = 'menu-item';
            btn.innerText = cat;
            btn.onclick = () => {
                stateStack.push({ type: 'category', label: cat, data: db[cat] });
                history.pushState({ depth: stateStack.length }, cat);
                render();
            };
            list.appendChild(btn);
        });
        viewContainer.appendChild(list);
        updateUI([]);
    } 
    else if (current.type === 'category') {
        viewContainer.classList.add('centered');
        const list = document.createElement('div');
        list.className = 'menu-list';
        Object.keys(current.data).forEach(mod => {
            const btn = document.createElement('button');
            btn.className = 'menu-item';
            btn.innerText = mod;
            btn.onclick = () => {
                stateStack.push({ type: 'grid', label: mod, data: current.data[mod] });
                history.pushState({ depth: stateStack.length }, mod);
                render();
            };
            list.appendChild(btn);
        });
        viewContainer.appendChild(list);
        updateUI(titlePath);
    }
    else if (current.type === 'grid') {
        viewContainer.classList.remove('centered');
        const gridData = current.data;
        const base = getRelPath(gridData.path);

        gridData.content.forEach(itemName => {
            const card = document.createElement('div');
            card.className = 'item-card';
            card.innerHTML = `
                <img src="${base}${itemName}/thumbnail.png" onerror="this.style.display='none'">
                <div class="label">${itemName}</div>`;
            card.onclick = () => loadItem(gridData.path, itemName);
            viewContainer.appendChild(card);
        });
        updateUI(titlePath);
    }
    else if (current.type === 'content' || current.type === 'about') {
        viewContainer.classList.remove('centered');
        viewContainer.innerHTML = `<div id="content-viewer" style="display:block">${current.html}</div>`;
        updateUI(titlePath, true);
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
    } catch (e) {
        alert("Document unavailable.");
    }
}

init();
