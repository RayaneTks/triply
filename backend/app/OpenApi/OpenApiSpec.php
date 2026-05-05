<?php

namespace App\OpenApi;

use OpenApi\Attributes as OA;

#[OA\OpenApi(openapi: OA\OpenApi::VERSION_3_0_0)]
#[OA\Info(
    title: 'Triply API',
    version: '1.0.0',
    description: 'Documentation de l\'API Triply v1 (squelettes et reponses provisoires, sans logique metier).'
)]
#[OA\Server(
    url: '/api/v1',
    description: 'API v1'
)]
#[OA\SecurityScheme(
    securityScheme: 'bearerAuth',
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'Sanctum'
)]
#[OA\Tag(name: 'Health')]
#[OA\Tag(name: 'Authentification')]
#[OA\Tag(name: 'Profil')]
#[OA\Tag(name: 'Voyages')]
#[OA\Tag(name: 'Journees')]
#[OA\Tag(name: 'Activites')]
#[OA\Tag(name: 'Lieux')]
#[OA\Tag(name: 'IA')]
#[OA\Tag(name: 'Transports')]
#[OA\Tag(name: 'Partage')]
#[OA\Tag(name: 'Exports')]
#[OA\Tag(name: 'Consentement')]
#[OA\Tag(name: 'Reservation')]
#[OA\Tag(name: 'Administration')]
#[OA\Schema(
    schema: 'ApiSuccess',
    properties: [
        new OA\Property(property: 'success', type: 'boolean', example: true),
        new OA\Property(property: 'data', type: 'object'),
        new OA\Property(property: 'meta', type: 'object'),
    ],
    type: 'object'
)]
#[OA\Schema(
    schema: 'ApiError',
    properties: [
        new OA\Property(property: 'success', type: 'boolean', example: false),
        new OA\Property(
            property: 'error',
            properties: [
                new OA\Property(property: 'code', type: 'string', example: 'VALIDATION_ERROR'),
                new OA\Property(property: 'message', type: 'string', example: 'Requete invalide'),
                new OA\Property(property: 'details', type: 'object'),
            ],
            type: 'object'
        ),
    ],
    type: 'object'
)]
#[OA\Response(
    response: 'ErrorBadRequest',
    description: 'Requete invalide',
    content: new OA\JsonContent(
        ref: '#/components/schemas/ApiError',
        example: [
            'success' => false,
            'error' => [
                'code' => 'BAD_REQUEST',
                'message' => 'Requete invalide.',
                'details' => [],
            ],
        ]
    )
)]
#[OA\Response(
    response: 'ErrorUnauthorized',
    description: 'Authentification requise',
    content: new OA\JsonContent(
        ref: '#/components/schemas/ApiError',
        example: [
            'success' => false,
            'error' => [
                'code' => 'UNAUTHORIZED',
                'message' => 'Authentification requise.',
                'details' => [],
            ],
        ]
    )
)]
#[OA\Response(
    response: 'ErrorForbidden',
    description: 'Acces refuse',
    content: new OA\JsonContent(
        ref: '#/components/schemas/ApiError',
        example: [
            'success' => false,
            'error' => [
                'code' => 'FORBIDDEN',
                'message' => 'Acces refuse.',
                'details' => [],
            ],
        ]
    )
)]
#[OA\Response(
    response: 'ErrorNotFound',
    description: 'Ressource introuvable',
    content: new OA\JsonContent(
        ref: '#/components/schemas/ApiError',
        example: [
            'success' => false,
            'error' => [
                'code' => 'NOT_FOUND',
                'message' => 'Ressource introuvable.',
                'details' => [],
            ],
        ]
    )
)]
#[OA\Response(
    response: 'ErrorValidation',
    description: 'Erreurs de validation',
    content: new OA\JsonContent(
        ref: '#/components/schemas/ApiError',
        example: [
            'success' => false,
            'error' => [
                'code' => 'VALIDATION_ERROR',
                'message' => 'Requete invalide',
                'details' => [
                    'email' => ['Ce champ est obligatoire.'],
                ],
            ],
        ]
    )
)]
#[OA\Response(
    response: 'ErrorRateLimited',
    description: 'Trop de requetes',
    content: new OA\JsonContent(
        ref: '#/components/schemas/ApiError',
        example: [
            'success' => false,
            'error' => [
                'code' => 'TOO_MANY_REQUESTS',
                'message' => 'Trop de requetes. Reessayez plus tard.',
                'details' => [],
            ],
        ]
    )
)]
#[OA\Response(
    response: 'ErrorInternal',
    description: 'Erreur interne serveur',
    content: new OA\JsonContent(
        ref: '#/components/schemas/ApiError',
        example: [
            'success' => false,
            'error' => [
                'code' => 'INTERNAL_SERVER_ERROR',
                'message' => 'Une erreur interne est survenue.',
                'details' => [],
            ],
        ]
    )
)]
final class OpenApiSpec
{
}
