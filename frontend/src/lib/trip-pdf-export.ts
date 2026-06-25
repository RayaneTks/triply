import type { ActivityDayBucket } from './activities-client';
import { buildDayActivitySchedule } from '../features/trips/trip-time-utils';

export interface TripPdfExportData {
    destination: string;
    dates: string;
    travelers: number;
    totalBudget: number;
    allocatedBudget: number;
    remainingBudget: number;
    activitiesByDay: ActivityDayBucket[];
}

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function buildTripPdfHtml(data: TripPdfExportData): string {
    const activitiesCount = data.activitiesByDay.reduce((sum, day) => sum + day.activities.length, 0);
    const generatedAt = new Date().toLocaleString('fr-FR');

    const dayBlocks = data.activitiesByDay
        .map((day) => {
            const activities = buildDayActivitySchedule(day)
                .map((item, idx) => {
                    const cost =
                        typeof item.cost === 'number'
                            ? `${item.cost.toLocaleString('fr-FR')} €`
                            : '—';
                    const city = item.city ? ` · ${escapeHtml(item.city)}` : '';
                    return `
                        <li>
                            <div class="row-head">
                                <span class="time">${item.startTime} – ${item.endTime}</span>
                                <span class="price">${cost}</span>
                            </div>
                            <div class="meta">${idx + 1}. ${escapeHtml(item.title)}${city}</div>
                            <div class="meta">Durée : ${escapeHtml(item.durationLabel)}</div>
                        </li>
                    `;
                })
                .join('');

            return `
                <section class="day-card">
                    <h3>Jour ${day.index + 1}${day.date ? ` · ${escapeHtml(day.date)}` : ''}</h3>
                    <ol>${activities || '<li class="empty">Aucune activité</li>'}</ol>
                </section>
            `;
        })
        .join('');

    return `<!doctype html>
<html lang="fr">
    <head>
        <meta charset="utf-8" />
        <title>Triply - ${escapeHtml(data.destination)}</title>
        <style>
            @page { size: A4; margin: 16mm; }
            body { font-family: Inter, Segoe UI, Arial, sans-serif; color: #0f172a; background: #f8fafc; margin: 0; }
            .wrap { max-width: 980px; margin: 0 auto; padding: 18px; }
            .hero { background: linear-gradient(135deg, #0ea5e9, #2563eb); color: white; border-radius: 18px; padding: 22px; }
            .hero h1 { margin: 0 0 8px; font-size: 28px; }
            .hero p { margin: 0; opacity: 0.95; }
            .stats { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 10px; margin-top: 14px; }
            .stat { background: #ffffff; border: 1px solid #dbeafe; border-radius: 12px; padding: 10px; }
            .stat .k { color: #475569; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: .03em; }
            .stat .v { margin-top: 4px; color: #0f172a; font-size: 18px; font-weight: 800; }
            .section { margin-top: 18px; }
            .section h2 { margin: 0 0 10px; font-size: 16px; color: #1e293b; }
            .days { display: grid; grid-template-columns: 1fr; gap: 10px; }
            .day-card { background: white; border: 1px solid #e2e8f0; border-radius: 14px; padding: 12px; break-inside: avoid; }
            .day-card h3 { margin: 0 0 10px; font-size: 14px; color: #0f172a; }
            .day-card ol { margin: 0; padding-left: 18px; }
            .day-card li { margin-bottom: 8px; }
            .row-head { display: flex; justify-content: space-between; gap: 12px; align-items: center; }
            .time { color: #0369a1; font-weight: 700; font-size: 12px; white-space: nowrap; }
            .price { color: #0369a1; white-space: nowrap; }
            .meta { margin-top: 2px; font-size: 12px; color: #64748b; }
            .empty { list-style: none; margin-left: -18px; color: #64748b; }
            .footer { margin-top: 16px; font-size: 11px; color: #64748b; text-align: right; }
        </style>
    </head>
    <body>
        <main class="wrap">
            <header class="hero">
                <h1>${escapeHtml(data.destination)}</h1>
                <p>${escapeHtml(data.dates)} · ${data.travelers} voyageur${data.travelers > 1 ? 's' : ''}</p>
                <div class="stats">
                    <div class="stat"><div class="k">Budget total</div><div class="v">${data.totalBudget.toLocaleString('fr-FR')} €</div></div>
                    <div class="stat"><div class="k">Activités</div><div class="v">${activitiesCount}</div></div>
                    <div class="stat"><div class="k">Alloué</div><div class="v">${data.allocatedBudget.toLocaleString('fr-FR')} €</div></div>
                    <div class="stat"><div class="k">Reste</div><div class="v">${data.remainingBudget.toLocaleString('fr-FR')} €</div></div>
                </div>
            </header>
            <section class="section">
                <h2>Programme détaillé</h2>
                <div class="days">${dayBlocks || '<p>Aucune activité pour ce voyage.</p>'}</div>
            </section>
            <div class="footer">Document généré le ${generatedAt} via Triply</div>
        </main>
    </body>
</html>`;
}

/** Imprime le voyage en PDF via une iframe cachée (pas de popup bloquée). */
export function printTripPdf(data: TripPdfExportData): void {
    if (typeof document === 'undefined') return;

    const html = buildTripPdfHtml(data);
    const iframe = document.createElement('iframe');
    iframe.setAttribute('title', 'Export PDF Triply');
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
    document.body.appendChild(iframe);

    const win = iframe.contentWindow;
    const doc = win?.document;
    if (!win || !doc) {
        iframe.remove();
        throw new Error('Impossible de préparer l\'export PDF.');
    }

    doc.open();
    doc.write(html);
    doc.close();

    const cleanup = () => {
        iframe.remove();
    };

    win.addEventListener('afterprint', cleanup, { once: true });
    window.setTimeout(cleanup, 120_000);

    window.setTimeout(() => {
        win.focus();
        win.print();
    }, 150);
}
