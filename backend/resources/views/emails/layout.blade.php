<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1.0">
    <title>{{ $title ?? 'Triply' }}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f6f8;padding:32px 0;">
        <tr>
            <td align="center">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 8px 24px rgba(15,23,42,0.08);">
                    <tr>
                        <td style="padding:32px 32px 16px 32px;background:linear-gradient(135deg,#0096C7 0%,#115C75 100%);color:#ffffff;">
                            <h1 style="margin:0;font-size:28px;font-weight:700;letter-spacing:-0.02em;">Triply</h1>
                            <p style="margin:8px 0 0 0;font-size:14px;opacity:0.9;">Votre copilote voyage</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:32px;">
                            {!! $slot !!}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:24px 32px;background-color:#f8fafc;border-top:1px solid #e2e8f0;color:#64748b;font-size:12px;line-height:1.5;">
                            <p style="margin:0;">Vous recevez cet email parce que vous avez créé un compte sur Triply.</p>
                            <p style="margin:8px 0 0 0;">Si ce n'est pas vous, ignorez ce message en toute sécurité.</p>
                            <p style="margin:16px 0 0 0;color:#94a3b8;">&copy; {{ date('Y') }} Triply. Tous droits réservés.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
