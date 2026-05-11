@component('emails.layout', ['title' => 'Rappel ' . $tripTitle])
<h2 style="margin:0 0 16px 0;font-size:22px;color:#0f172a;">
    {{ $kind === 'morning' ? 'Bonjour ' : 'Demain, ' }}{{ $name }} !
</h2>
<p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#334155;">
    @if ($kind === 'morning')
        Voici votre programme du jour pour <strong>{{ $tripTitle }}</strong>.
    @else
        Demain ({{ $dateLabel }}), voici ce qui vous attend pour <strong>{{ $tripTitle }}</strong>.
    @endif
</p>

@if (count($activities) > 0)
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;border-collapse:collapse;">
        @foreach ($activities as $idx => $activity)
            <tr>
                <td style="padding:12px;border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc;margin-bottom:8px;">
                    <strong style="color:#0f172a;">{{ $idx + 1 }}. {{ $activity['title'] ?? 'Activite' }}</strong>
                    @if (! empty($activity['city']))
                        <div style="color:#64748b;font-size:13px;margin-top:4px;">{{ $activity['city'] }}</div>
                    @endif
                </td>
            </tr>
        @endforeach
    </table>
@else
    <p style="color:#64748b;">Aucune activite programmee.</p>
@endif

<div style="text-align:center;margin:32px 0;">
    <a href="{{ $tripUrl }}" style="display:inline-block;padding:14px 28px;background:#0096C7;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;">
        Voir mon voyage
    </a>
</div>
@endcomponent
