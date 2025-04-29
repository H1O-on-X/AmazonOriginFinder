/**
 * Amazon Country of Origin Finder - Aggressive Page-Wide Scan Version
 * Finds "Country of Origin" anywhere in page text content.
 */

console.log("Amazon Country of Origin Finder: Aggressive page-wide scan mode");

const DEBOUNCE_DELAY = 500;
let debounceTimer = null;

function findCountryOfOrigin() {
    console.log("Searching entire page for 'Country of Origin'...");

    const bodyText = document.body.innerText;
    const match = bodyText.match(/Country of Origin[\s:\-]+([^\n]+)/i);

    if (match && match[1]) {
        const country = match[1].trim();
        if (country.length > 0 && country.length < 100) {
            console.log("Found Country of Origin:", country);
            return country;
        }
    }

    console.log("Country of Origin not found in page text.");
    return null;
}

function displayCountryInfo(country) {
    const injectionPoints = [
        {
            id: 'origin-display-box-buybox',
            targetSelector: '#buybox, #rightCol, #desktop_buybox',
            method: 'prepend',
            styleClass: ''
        },
        {
            id: 'origin-display-box-price',
            targetSelector: '#corePrice_feature_div, #unifiedPrice_feature_div',
            method: 'afterend',
            styleClass: 'origin-box-price'
        }
    ];

    let text = "Country of Origin: UNLISTED";
    let baseClass = 'origin-grey';

    if (country) {
        text = `Country of Origin: ${country}`;
        const lower = country.toLowerCase();
        baseClass = lower.includes("china") ? 'origin-china'
                  : (lower.includes("usa") || lower.includes("united states")) ? 'origin-usa'
                  : 'origin-other';
    }

    injectionPoints.forEach(({ id, targetSelector, method, styleClass }) => {
        const old = document.getElementById(id);
        if (old) old.remove();

        const target = document.querySelector(targetSelector);
        if (!target) return;

        const box = document.createElement('div');
        box.id = id;
        box.classList.add('origin-box', baseClass);
        if (styleClass) box.classList.add(styleClass);
        box.textContent = text;

        try {
            switch (method) {
                case 'prepend': target.prepend(box); break;
                case 'append': target.append(box); break;
                case 'before': target.before(box); break;
                case 'afterend': target.insertAdjacentElement('afterend', box); break;
                default: target.prepend(box);
            }
        } catch (err) {
            console.error(`Error injecting display box (${id})`, err);
        }
    });
}

function runOriginCheck() {
    const country = findCountryOfOrigin();
    displayCountryInfo(country);
}

const observer = new MutationObserver((mutations) => {
    let changed = false;
    for (const m of mutations) {
        if (m.type === 'childList' && (m.addedNodes.length > 0 || m.removedNodes.length > 0)) {
            if ([...m.addedNodes, ...m.removedNodes].some(n => n.id?.startsWith('origin-display-box'))) continue;
            changed = true;
            break;
        }
    }
    if (changed) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(runOriginCheck, DEBOUNCE_DELAY);
    }
});

const target = document.getElementById('dp-container') || document.body;
if (target) {
    observer.observe(target, { childList: true, subtree: true });
    console.log("Observer active.");
} else {
    console.error("No valid container for observer.");
}

setTimeout(runOriginCheck, 500);
