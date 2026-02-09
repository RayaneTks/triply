<?php

namespace App\OpenApi;

use OpenApi\Attributes as OA;

// Point d'entree global de la documentation OpenAPI:
// metadonnees API, serveur cible, schema de securite, tags fonctionnels.
#[OA\Info(
    title: 'Triply API',
    version: '1.0.0',
    description: 'Documentation API du backend Triply.'
)]
#[OA\Server(
    url: 'http://127.0.0.1:8000',
    description: 'Serveur local de developpement'
)]
#[OA\SecurityScheme(
    securityScheme: 'bearerAuth',
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT'
)]
#[OA\Tag(name: 'Sante', description: "Verification de sante de l'API")]
#[OA\Tag(name: 'Authentification', description: "Endpoints d'authentification")]
#[OA\Tag(name: 'Utilisateurs', description: 'Utilisateurs et profils')]
#[OA\Tag(name: 'Voyages', description: 'Gestion des voyages')]
#[OA\Tag(name: 'Reservations', description: 'Cycle de vie des reservations')]
#[OA\Tag(name: 'Paiements', description: 'Operations de paiement')]
#[OA\Tag(name: 'Avis', description: 'Avis et notes')]
#[OA\Tag(name: 'Notifications', description: 'Centre de notifications')]
final class OpenApiSpec
{
}
