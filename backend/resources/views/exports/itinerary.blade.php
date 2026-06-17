<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <title>{{ $trip['title'] }} — Triply</title>
    <style>
        @page { margin: 28px 32px; }
        * { font-family: DejaVu Sans, sans-serif; }
        body { color: #0f172a; font-size: 12px; line-height: 1.5; margin: 0; }
        .header { border-bottom: 3px solid #059669; padding-bottom: 12px; margin-bottom: 18px; }
        .brand { color: #059669; font-size: 13px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; }
        h1 { font-size: 24px; margin: 6px 0 2px; color: #0f172a; }
        .destination { color: #475569; font-size: 14px; margin: 0; }
        .meta { margin-top: 12px; }
        .meta-pill {
            display: inline-block; background: #ecfdf5; color: #047857;
            border: 1px solid #a7f3d0; border-radius: 12px;
            padding: 3px 10px; font-size: 11px; margin-right: 6px;
        }
        h2 {
            font-size: 14px; color: #059669; margin: 22px 0 8px;
            border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; text-transform: uppercase; letter-spacing: 1px;
        }
        .day { margin-bottom: 14px; }
        .day-head { background: #f1f5f9; border-left: 4px solid #059669; padding: 6px 10px; margin-bottom: 6px; }
        .day-title { font-weight: bold; font-size: 13px; color: #0f172a; }
        .day-date { color: #64748b; font-size: 11px; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 4px 6px; vertical-align: top; border-bottom: 1px solid #f1f5f9; }
        .act-title { font-weight: bold; }
        .act-city { color: #64748b; font-size: 11px; }
        .act-meta { color: #047857; font-size: 11px; text-align: right; white-space: nowrap; }
        .empty { color: #94a3b8; font-style: italic; padding: 4px 6px; }
        .logistics td { padding: 5px 6px; }
        .logistics .label { color: #64748b; width: 110px; }
        .footer { margin-top: 28px; border-top: 1px solid #e2e8f0; padding-top: 8px; color: #94a3b8; font-size: 10px; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <div class="brand">Triply</div>
        <h1>{{ $trip['title'] }}</h1>
        <p class="destination">{{ $trip['destination'] }}</p>
        <div class="meta">
            <span class="meta-pill">{{ $trip['start_date']->translatedFormat('d M Y') }} → {{ $trip['end_date']->translatedFormat('d M Y') }}</span>
            <span class="meta-pill">{{ $trip['travel_days'] }} jour{{ $trip['travel_days'] > 1 ? 's' : '' }}</span>
            <span class="meta-pill">{{ $trip['travelers'] }} voyageur{{ $trip['travelers'] > 1 ? 's' : '' }}</span>
            @if($trip['budget'])
                <span class="meta-pill">Budget {{ (int) $trip['budget'] }} €</span>
            @endif
        </div>
    </div>

    @if(count($transports) > 0)
        <h2>Transports</h2>
        <table class="logistics">
            @foreach($transports as $t)
                <tr>
                    <td class="label">{{ $t['type'] ?: 'Transport' }}</td>
                    <td>
                        <strong>{{ $t['from'] }} → {{ $t['to'] }}</strong><br>
                        @if($t['depart']){{ \Carbon\Carbon::parse($t['depart'])->translatedFormat('d M Y H:i') }}@endif
                        @if($t['arrivee']) — {{ \Carbon\Carbon::parse($t['arrivee'])->translatedFormat('d M Y H:i') }}@endif
                    </td>
                    <td class="act-meta">@if($t['price']){{ (int) $t['price'] }} {{ $t['currency'] ?: 'EUR' }}@endif</td>
                </tr>
            @endforeach
        </table>
    @endif

    @if(count($hebergements) > 0)
        <h2>Hébergements</h2>
        <table class="logistics">
            @foreach($hebergements as $h)
                <tr>
                    <td class="label">{{ $h['name'] }}</td>
                    <td>
                        {{ $h['address'] ?: $h['city'] }}<br>
                        @if($h['checkin']){{ \Carbon\Carbon::parse($h['checkin'])->translatedFormat('d M') }}@endif
                        @if($h['checkout']) → {{ \Carbon\Carbon::parse($h['checkout'])->translatedFormat('d M Y') }}@endif
                    </td>
                    <td class="act-meta">@if($h['price']){{ (int) $h['price'] }} {{ $h['currency'] ?: 'EUR' }}@endif</td>
                </tr>
            @endforeach
        </table>
    @endif

    <h2>Itinéraire jour par jour</h2>
    @forelse($days as $day)
        <div class="day">
            <div class="day-head">
                <span class="day-title">Jour {{ $day['index'] }}</span>
                @if($day['date'])<span class="day-date"> — {{ $day['date']->translatedFormat('l d F Y') }}</span>@endif
            </div>
            @if(count($day['activities']) > 0)
                <table>
                    @foreach($day['activities'] as $act)
                        <tr>
                            <td>
                                <span class="act-title">{{ $act['title'] }}</span>
                                @if($act['city'])<br><span class="act-city">{{ $act['city'] }}</span>@endif
                            </td>
                            <td class="act-meta">
                                @if($act['duration'] && $act['duration'] !== '0h'){{ $act['duration'] }}@endif
                                @if($act['price'] && (float) $act['price'] > 0)<br>{{ (int) $act['price'] }} €@endif
                            </td>
                        </tr>
                    @endforeach
                </table>
            @else
                <div class="empty">Journée libre — aucune activité planifiée.</div>
            @endif
        </div>
    @empty
        <div class="empty">Aucune journée planifiée pour ce voyage.</div>
    @endforelse

    <div class="footer">
        Généré par Triply le {{ $generated_at->translatedFormat('d F Y à H:i') }} · triply.ovh
    </div>
</body>
</html>
