@component('emails.layout', ['title' => 'Réinitialisation du mot de passe'])
    <h2 style="margin:0 0 16px 0;font-size:22px;color:#0f172a;">Bonjour {{ $name }},</h2>
    <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#334155;">
        Vous avez demandé la réinitialisation de votre mot de passe Triply. Cliquez sur le bouton ci-dessous
        pour choisir un nouveau mot de passe.
    </p>
    <p style="margin:32px 0;text-align:center;">
        <a href="{{ $resetUrl }}"
           style="display:inline-block;background-color:#0096C7;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;">
            Réinitialiser mon mot de passe
        </a>
    </p>
    <p style="margin:16px 0;font-size:13px;line-height:1.6;color:#64748b;">
        Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :
    </p>
    <p style="margin:0;font-size:12px;color:#0096C7;word-break:break-all;">
        {{ $resetUrl }}
    </p>
    <p style="margin:24px 0 0 0;font-size:13px;color:#64748b;">
        Si vous n'avez pas demandé cette réinitialisation, ignorez cet email. Votre mot de passe restera inchangé.
        Ce lien expire dans 60 minutes.
    </p>
@endcomponent
