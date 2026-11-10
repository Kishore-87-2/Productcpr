(function () {
    'use strict';

    const ui = document.createElement('style');
    ui.id = 'comparison-ui-theme';
    ui.textContent = `
        :root { --comparison-primary: #1e3a5f; --comparison-accent: #2a9bc9; --comparison-bg: #f4f6f9; }
        html { min-height: 100%; background: var(--comparison-bg); }
        body {
            display: block !important; min-height: 100vh; margin: 0 !important;
            padding: 24px 16px !important; background: var(--comparison-bg) !important;
            color: #333 !important; font-family: 'Segoe UI', Arial, sans-serif !important;
            line-height: 1.5;
        }
        .container {
            width: 100% !important; max-width: 1200px !important; margin: 0 auto !important;
            padding: 0 !important; background: #fff !important; text-align: left !important;
            border-radius: 16px !important; box-shadow: 0 10px 30px rgba(0,0,0,.10) !important;
            overflow: hidden;
        }
        header {
            position: relative; padding: 20px 25px !important; text-align: center !important;
            color: #fff !important; background: linear-gradient(135deg,#4ec0e0,#2a9bc9) !important;
        }
        header h1, h1 {
            margin: 0 !important; color: #fff !important; font-size: clamp(22px,3vw,30px) !important;
            font-weight: 600 !important; line-height: 1.25;
        }
        .home-btn {
            position: absolute; left: 20px; top: 50%; transform: translateY(-50%);
            padding: 9px 15px !important; border-radius: 8px !important;
            background: #fff !important; color: var(--comparison-accent) !important;
            font-weight: 600; text-decoration: none !important;
        }
        .controls, .dropdowns {
            display: grid !important; grid-template-columns: repeat(auto-fit,minmax(220px,1fr));
            gap: 16px !important; padding: 24px !important; margin: 0 !important;
            background: #f8f9fa !important; border-bottom: 1px solid #e8edf2;
        }
        .select-group, .dropdowns > div { min-width: 0; }
        label {
            display: block; margin: 0 0 7px !important; color: #344054 !important;
            font-size: 14px; font-weight: 600 !important;
        }
        select, input[type="text"], input[type="search"] {
            width: 100%; min-height: 44px; padding: 10px 12px !important;
            border: 1px solid #cbd5e1 !important; border-radius: 8px !important;
            background: #fff; color: #1f2937; font: inherit; box-sizing: border-box;
        }
        select:focus, input:focus {
            outline: 3px solid rgba(42,155,201,.18); border-color: var(--comparison-accent) !important;
        }
        .buttons {
            display: flex !important; flex-wrap: wrap; gap: 10px !important;
            justify-content: center !important; padding: 20px 24px !important;
            margin: 0 !important; background: #fff !important;
        }
        button, button[data-comparison-action] {
            min-height: 42px; padding: 10px 17px !important; margin: 0 !important;
            border: 0 !important; border-radius: 8px !important;
            background: var(--comparison-primary) !important; color: #fff !important;
            font: 600 14px/1.3 'Segoe UI',Arial,sans-serif !important;
            cursor: pointer; transition: background-color .15s ease, transform .15s ease;
        }
        button:hover:not(:disabled) { background: var(--comparison-accent) !important; transform: translateY(-1px); }
        button:disabled { opacity: .55; cursor: not-allowed; }
        #loading, #comparison-data-status {
            padding: 14px 20px !important; margin: 0 !important; color: #475467 !important;
            font: 14px/1.5 'Segoe UI',Arial,sans-serif !important; text-align: center;
        }
        .comparison-result, #tableContainer, #comparisonTable { width: 100%; overflow-x: auto; }
        table {
            width: 100% !important; border-collapse: collapse !important; margin: 0 !important;
            background: #fff; font-size: 14px; text-align: left;
        }
        th, td {
            padding: 12px 14px !important; border: 1px solid #e6eaf0 !important;
            vertical-align: top; text-align: left !important; white-space: pre-line;
        }
        th { background: #eef4f8 !important; color: #1e3a5f !important; font-weight: 700 !important; }
        tbody tr:nth-child(even) { background: #f8fafc; }
        tbody tr:hover { background: #eef7fb !important; }
        @media (max-width: 640px) {
            body { padding: 12px 8px !important; }
            .container { border-radius: 10px !important; }
            header { padding: 62px 14px 18px !important; }
            .home-btn { left: 12px; top: 12px; transform: none; padding: 7px 11px !important; }
            .controls, .dropdowns { grid-template-columns: 1fr; padding: 16px !important; }
            .buttons { padding: 16px !important; }
            button, button[data-comparison-action] { flex: 1 1 145px; }
            th, td { padding: 9px 10px !important; font-size: 13px; }
        }
        @media print {
            body { padding: 0 !important; background: #fff !important; }
            .container { max-width: none !important; box-shadow: none !important; }
            .controls, .dropdowns, .buttons, .home-btn, #loading, #comparison-data-status { display: none !important; }
        }
    `;
    document.head.appendChild(ui);
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
                pdf.autoTable({
                    head: [['Feature', ...group.map(pdfText)]],
                    body: data.features.map(f => [pdfText(f), ...group.map(n => pdfText(data.products[n][f]))]),
                    startY: 22, margin: { top: 12, right: 12, bottom: 12, left: 12 }, theme: 'grid',
                    styles: { font: 'helvetica', fontSize: 9, cellPadding: 3, overflow: 'linebreak', lineColor: [220, 226, 232] },
                    headStyles: { fillColor: [42, 155, 201], textColor: [255, 255, 255] },
                    columnStyles: { 0: { cellWidth: 65, fontStyle: 'bold' } },
                    showHead: 'everyPage',
                    didDrawPage: function () {
                        pdf.setFont('helvetica', 'bold');
                        pdf.setFontSize(14);
                        pdf.setTextColor(30, 58, 95);
                        pdf.setFont('helvetica', 'normal');
                        pdf.setFontSize(8);
                        pdf.setTextColor(100, 110, 120);
                        pdf.text('Page ' + pdf.internal.getNumberOfPages(), pdf.internal.pageSize.getWidth() - 12,
                            pdf.internal.pageSize.getHeight() - 7, { align: 'right' });
                    }
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
