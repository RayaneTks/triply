@component('emails.layout', ['title' => 'Confirmez votre email'])
    <h2 style="margin:0 0 16px 0;font-size:22px;color:#0f172a;">Bienvenue {{ $name }} !</h2>
    <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#334155;">
        Merci de rejoindre Triply. Pour activer votre compte et profiter de toutes les fonctionnalités,
        cliquez sur le bouton ci-dessous pour confirmer votre adresse email.
    </p>
    <p style="margin:32px 0;text-align:center;">
        <a href="{{ $verificationUrl }}"
           style="display:inline-block;background-color:#0096C7;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;">
            Confirmer mon email
        </a>
    </p>
    <p style="margin:16px 0;font-size:13px;line-height:1.6;color:#64748b;">
        Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :
    </p>
    <p style="margin:0;font-size:12px;color:#0096C7;word-break:break-all;">
        {{ $verificationUrl }}
    </p>
    <p style="margin:24px 0 0 0;font-size:13px;color:#64748b;">
        Ce lien expire dans 60 minutes.
    </p>
@endcomponent
