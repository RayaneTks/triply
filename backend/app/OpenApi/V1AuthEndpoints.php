<?php

namespace App\OpenApi;

use OpenApi\Attributes as OA;

/**
 * Endpoints d'authentification.
 *
 * Enregistrements, connexion, reset de mot de passe et verification d'email.
 * Toutes ces routes manipulent la table `users` et les tables techniques
 * de tokens / reset generes par Laravel.
 */
final class V1AuthEndpoints
{
    /**
     * POST /api/v1/auth/register
     *
     * Cree un nouvel utilisateur dans la table `users`.
     */
    #[OA\Post(
        path: '/auth/register',
        tags: ['Authentification'],
        requestBody: new OA\RequestBody(
            required: false,
            content: new OA\JsonContent(
                example: [
                    'name' => 'Rayan',
                    'email' => 'rayan@example.com',
                    'password' => 'secret12345',
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Inscription',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ApiSuccess',
                    example: [
                        'success' => true,
                        'data' => [
                            'stub' => true,
                            'message' => 'Inscription',
                        ],
                        'meta' => [],
                    ]
                )
            ),
        ]
    )]
    public function register(): void {}

    /**
     * POST /api/v1/auth/login
     *
     * Authentifie un utilisateur et cree un token Sanctum.
     */
    #[OA\Post(
        path: '/auth/login',
        tags: ['Authentification'],
        requestBody: new OA\RequestBody(
            required: false,
            content: new OA\JsonContent(
                example: [
                    'email' => 'rayan@example.com',
                    'password' => 'secret12345',
                    'device_name' => 'web-chrome',
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Connexion',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ApiSuccess',
                    example: [
                        'success' => true,
                        'data' => [
                            'stub' => true,
                            'message' => 'Connexion',
                        ],
                        'meta' => [],
                    ]
                )
            ),
        ]
    )]
    public function login(): void {}

    /**
     * POST /api/v1/auth/logout
     *
     * Revoque le token de l'utilisateur connecte.
     */
    #[OA\Post(
        path: '/auth/logout',
        tags: ['Authentification'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: false,
            content: new OA\JsonContent(
                example: [
                    'todo' => 'Payload JSON provisoire (stub)',
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Deconnexion',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ApiSuccess',
                    example: [
                        'success' => true,
                        'data' => [
                            'stub' => true,
                            'message' => 'Deconnexion',
                        ],
                        'meta' => [],
                    ]
                )
            ),
        ]
    )]
    public function logout(): void {}

    /**
     * POST /api/v1/auth/forgot-password
     *
     * Demande un lien de reinitialisation de mot de passe.
     */
    #[OA\Post(
        path: '/auth/forgot-password',
        tags: ['Authentification'],
        requestBody: new OA\RequestBody(
            required: false,
            content: new OA\JsonContent(
                example: [
                    'email' => 'rayan@example.com',
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 202,
                description: 'Mot de passe oublie',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ApiSuccess',
                    example: [
                        'success' => true,
                        'data' => [
                            'stub' => true,
                            'message' => 'Mot de passe oublie',
                        ],
                        'meta' => [],
                    ]
                )
            ),
        ]
    )]
    public function forgotPassword(): void {}

    /**
     * POST /api/v1/auth/reset-password
     *
     * Utilise le token de reset pour definir un nouveau mot de passe.
     */
    #[OA\Post(
        path: '/auth/reset-password',
        tags: ['Authentification'],
        requestBody: new OA\RequestBody(
            required: false,
            content: new OA\JsonContent(
                example: [
                    'token' => 'reset-token',
                    'email' => 'rayan@example.com',
                    'password' => 'newsecret123',
                    'password_confirmation' => 'newsecret123',
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Reinitialiser le mot de passe',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ApiSuccess',
                    example: [
                        'success' => true,
                        'data' => [
                            'stub' => true,
                            'message' => 'Reinitialiser le mot de passe',
                        ],
                        'meta' => [],
                    ]
                )
            ),
        ]
    )]
    public function resetPassword(): void {}

    /**
     * GET /api/v1/auth/me
     *
     * Retourne les informations de l'utilisateur connecte.
     */
    #[OA\Get(
        path: '/auth/me',
        tags: ['Authentification'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Utilisateur courant',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ApiSuccess',
                    example: [
                        'success' => true,
                        'data' => [
                            'stub' => true,
                            'message' => 'Utilisateur courant',
                        ],
                        'meta' => [],
                    ]
                )
            ),
        ]
    )]
    public function me(): void {}

    /**
     * POST /api/v1/auth/email/verify
     *
     * Confirme l'adresse email d'un utilisateur a l'aide d'un lien signe.
     */
    #[OA\Post(
        path: '/auth/email/verify',
        tags: ['Authentification'],
        requestBody: new OA\RequestBody(
            required: false,
            content: new OA\JsonContent(
                example: [
                    'id' => 'usr_stub_001',
                    'hash' => 'email-hash',
                    'signature' => 'signed-url-signature',
                    'expires' => 1735689600,
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Verifier l\'email',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ApiSuccess',
                    example: [
                        'success' => true,
                        'data' => [
                            'stub' => true,
                            'message' => 'Verifier l\'email',
                        ],
                        'meta' => [],
                    ]
                )
            ),
        ]
    )]
    public function verifyEmail(): void {}
}
