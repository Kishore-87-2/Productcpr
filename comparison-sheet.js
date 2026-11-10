(function () {
    'use strict';
    const script = document.currentScript;
    const sheetId = script.dataset.sheetId;
    const fallbackUrl = new URL(script.dataset.fallback, script.src);
    const spreadsheetId = '1erQap33aHV_oVlyXq3UYda0ZrsLGqQ_rOSVBEUWIPnM';
    const endpoint = 'https://docs.google.com/spreadsheets/d/' + spreadsheetId +
        '/gviz/tq?gid=' + encodeURIComponent(sheetId) + '&headers=1&tqx=out:json';
    const main = document.getElementById('productSelect') || document.getElementById('product');
    const first = document.getElementById('competitorSelect') || document.getElementById('competitor1');
    const second = document.getElementById('competitorSelect2') || document.getElementById('competitor2');
    const target = document.getElementById('comparisonTable') ||
        document.getElementById('productComparison') || document.getElementById('comparisonResult');
    const buttons = Array.from(document.querySelectorAll('button[data-comparison-action]'));
    let data, names = [], displayed = [];
    const status = document.createElement('p');
    status.id = 'comparison-data-status';
    status.setAttribute('role', 'status');
    status.style.cssText = 'padding:12px 20px;margin:0;color:#444;font:14px/1.5 Arial,sans-serif';
    target.parentNode.insertBefore(status, target);
    status.textContent = 'Loading comparison data…';
    buttons.forEach(b => b.disabled = true);
    [main, first, second].filter(Boolean).forEach(s => s.disabled = true);

    function validate(value) {
        if (!value || !Array.isArray(value.features) || !value.features.length ||
            !value.products || !Object.keys(value.products).length) throw new Error('Empty comparison data');
        return value;
    }
    function parseResponse(text) {
        const begin = text.indexOf('{'), end = text.lastIndexOf('}');
        if (begin < 0 || end < begin) throw new Error('Invalid sheet response');
        const response = JSON.parse(text.slice(begin, end + 1));
        if (response.status !== 'ok' || !response.table) throw new Error('Sheet unavailable');
        const cols = response.table.cols;
        const products = Object.create(null), features = [], indexes = [];
        for (let i = 1; i < cols.length; i++) {
            const name = String(cols[i].label || '').trim();
            if (!name) continue;
            if (Object.hasOwn(products, name)) throw new Error('Duplicate model name');
            products[name] = Object.create(null); indexes.push([i, name]);
        }
        const cellText = cell => cell == null ? '' : String(cell.f ?? cell.v ?? '');
        for (const row of response.table.rows) {
            const feature = cellText(row.c[0]);
            if (!feature.trim()) continue;
            if (features.includes(feature)) throw new Error('Duplicate feature name');
            features.push(feature);
            for (const [i, name] of indexes) products[name][feature] = cellText(row.c[i]);
        }
        return validate({ products, features });
    }
    async function request(url, type) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        try {
            const response = await fetch(url, { signal: controller.signal, cache: 'no-store', credentials: 'omit' });
            if (!response.ok) throw new Error('Request failed');
            return type === 'json' ? await response.json() : await response.text();
        } finally { clearTimeout(timeout); }
    }
    function options(select, models, selected, allowNone) {
        if (!select) return;
        select.replaceChildren();
        if (allowNone) select.add(new Option('None', ''));
        models.forEach(name => select.add(new Option(name, name)));
        select.value = models.includes(selected) ? selected : (allowNone ? '' : (models[0] || ''));
    }
    function refreshCompetitors() {
        const available = names.filter(n => n !== main.value);
        options(first, available, first.value || available[0], available.length === 0);
        options(second, available.filter(n => n !== first.value), second.value, true);
        render(selected());
    }
    function selected() {
        return main ? [...new Set([main.value, first?.value, second?.value].filter(n => names.includes(n)))] : names;
    }
    function displayValue(value) {
        return String(value ?? 'NA').replace(/<br\s*\/?\s*>/gi, '\n');
    }
    function render(models) {
        displayed = models;
        const table = target.tagName === 'TABLE' ? target : document.createElement('table');
        table.replaceChildren();
        table.style.width = '100%';
        const head = table.createTHead().insertRow();
        ['Feature', ...models].forEach(label => { const th = document.createElement('th'); th.textContent = label; head.appendChild(th); });
        const body = table.createTBody();
        data.features.forEach(feature => {
            const row = body.insertRow();
            [feature, ...models.map(n => displayValue(data.products[n][feature]))].forEach(value => {
                const td = row.insertCell(); td.textContent = value; td.style.whiteSpace = 'pre-line';
            });
        });
        if (table !== target) target.replaceChildren(table);
        target.style.display = '';
        const parent = document.getElementById('tableContainer');
        if (parent) { parent.style.display = 'block'; parent.style.overflowX = 'auto'; }
        if (target.tagName !== 'TABLE') target.style.overflowX = 'auto';
    }
    function pdfText(value) {
        return displayValue(value).replace(/Ω/g, 'Ohm').replace(/μ|µ/g, 'u').replace(/✔|✓/g, 'Yes')
            .replace(/✘|✗/g, 'No').replace(/≤/g, '<=').replace(/≥/g, '>=').replace(/[–−]/g, '-');
    }
    function exportPDF(models) {
        if (!models.length) return;
        try {
            if (!window.jspdf?.jsPDF) throw new Error('PDF library unavailable');
            const pdf = new window.jspdf.jsPDF('l', 'mm', 'a4');
            if (typeof pdf.autoTable !== 'function') throw new Error('PDF table library unavailable');
            for (let i = 0; i < models.length; i += 4) {
                if (i) pdf.addPage();
                const group = models.slice(i, i + 4);
                pdf.setFontSize(14); pdf.text('Product Comparison', 12, 14);
                pdf.autoTable({
                    head: [['Feature', ...group.map(pdfText)]],
                    body: data.features.map(f => [pdfText(f), ...group.map(n => pdfText(data.products[n][f]))]),
                    startY: 22, margin: { top: 12, right: 12, bottom: 12, left: 12 }, theme: 'grid',
                    styles: { fontSize: 9, cellPadding: 3, overflow: 'linebreak' },
                    headStyles: { fillColor: [30, 58, 95] }, columnStyles: { 0: { cellWidth: 65 } },
                    showHead: 'everyPage'
                });
            }
            pdf.save('Product_Comparison.pdf');
        } catch (error) { status.textContent = 'PDF export could not load. Please reload the page and try again.'; }
    }
    function initialize() {
        names = Object.keys(data.products);
        if (main) {
            let sonel = names.filter(n => /sonel/i.test(n));
            if (!sonel.length) sonel = names;
            options(main, sonel, main.value, false);
            refreshCompetitors();
            main.addEventListener('change', refreshCompetitors);
            first.addEventListener('change', () => {
                options(second, names.filter(n => n !== main.value && n !== first.value), second.value, true);
                render(selected());
            });
            second.addEventListener('change', () => render(selected()));
        } else render(names);
        buttons.forEach(button => {
            button.disabled = false;
            button.addEventListener('click', () => {
                switch (button.dataset.comparisonAction) {
                    case 'compare-all': render(names); break;
                    case 'compare-selected': render(selected()); break;
                    case 'export-all': exportPDF(names); break;
                    case 'export-selected': exportPDF(selected()); break;
                    case 'export-current': exportPDF(displayed); break;
                    case 'clear':
                        if (main) { main.selectedIndex = 0; first.value = ''; second.value = ''; refreshCompetitors(); }
                        break;
                }
            });
        });
        [main, first, second].filter(Boolean).forEach(s => s.disabled = false);
        ['loading', 'errorMessage', 'notification'].forEach(id => {
            const element = document.getElementById(id); if (element) element.style.display = 'none';
        });
    }
    (async () => {
        try {
            data = parseResponse(await request(endpoint, 'text'));
            status.textContent = ''; status.hidden = true;
        } catch (error) {
            try {
                data = validate(await request(fallbackUrl, 'json'));
                status.textContent = 'Live data is unavailable. Showing saved comparison data; reload to try again.';
            } catch (fallbackError) {
                status.textContent = 'Comparison data could not load. Please reload the page.';
                const loading = document.getElementById('loading'); if (loading) loading.style.display = 'none';
                return;
            }
        }
        initialize();
    })();
}());
