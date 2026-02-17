<?php

namespace App\OpenApi;

use OpenApi\Attributes as OA;

/**
 * Endpoints lies au profil utilisateur.
 *
 * Lecture / mise a jour du profil, preferences de voyage,
 * export et suppression de compte.
 */
final class V1ProfileEndpoints
{
    /**
     * GET /api/v1/profile
     *
     * Retourne les informations de profil de l'utilisateur connecte.
     */
    #[OA\Get(
        path: '/profile',
        tags: ['Profil'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(response: 400, ref: '#/components/responses/ErrorBadRequest'),
            new OA\Response(response: 401, ref: '#/components/responses/ErrorUnauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/ErrorForbidden'),
            new OA\Response(response: 404, ref: '#/components/responses/ErrorNotFound'),
            new OA\Response(response: 422, ref: '#/components/responses/ErrorValidation'),
            new OA\Response(response: 429, ref: '#/components/responses/ErrorRateLimited'),
            new OA\Response(response: 500, ref: '#/components/responses/ErrorInternal'),

            new OA\Response(
                response: 200,
                description: 'Profil',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ApiSuccess',
                    example: [
                        'success' => true,
                        'data' => [
                            'stub' => true,
                            'message' => 'Profil',
                        ],
                        'meta' => [],
                    ]
                )
            ),
        ]
    )]
    public function profileGet(): void {}

    /**
     * PATCH /api/v1/profile
     *
     * Met a jour les informations de base du profil (nom, avatar, fuseau horaire...).
     */
    #[OA\Patch(
        path: '/profile',
        tags: ['Profil'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: false,
            content: new OA\JsonContent(
                example: [
                    'name' => 'Rayan K',
                    'photo_url' => 'https://cdn.triply.test/avatar.png',
                    'timezone' => 'Europe/Paris',
                ]
            )
        ),
        responses: [
            new OA\Response(response: 400, ref: '#/components/responses/ErrorBadRequest'),
            new OA\Response(response: 401, ref: '#/components/responses/ErrorUnauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/ErrorForbidden'),
            new OA\Response(response: 404, ref: '#/components/responses/ErrorNotFound'),
            new OA\Response(response: 422, ref: '#/components/responses/ErrorValidation'),
            new OA\Response(response: 429, ref: '#/components/responses/ErrorRateLimited'),
            new OA\Response(response: 500, ref: '#/components/responses/ErrorInternal'),

            new OA\Response(
                response: 200,
                description: 'Mettre a jour le profil',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ApiSuccess',
                    example: [
                        'success' => true,
                        'data' => [
                            'stub' => true,
                            'message' => 'Mettre a jour le profil',
                        ],
                        'meta' => [],
                    ]
                )
            ),
        ]
    )]
    public function profilePatch(): void {}

    /**
     * PATCH /api/v1/profile/preferences
     *
     * Met a jour les preferences de voyage de l'utilisateur
     * (regime alimentaire, rythme, budget, centres d'interet...).
     */
    #[OA\Patch(
        path: '/profile/preferences',
        tags: ['Profil'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: false,
            content: new OA\JsonContent(
                example: [
                    'diet' => ['halal'],
                    'breakfast_included' => true,
                    'interests' => ['culture', 'food'],
                    'pace' => 'medium',
                    'max_budget' => 1200,
                ]
            )
        ),
        responses: [
            new OA\Response(response: 400, ref: '#/components/responses/ErrorBadRequest'),
            new OA\Response(response: 401, ref: '#/components/responses/ErrorUnauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/ErrorForbidden'),
            new OA\Response(response: 404, ref: '#/components/responses/ErrorNotFound'),
            new OA\Response(response: 422, ref: '#/components/responses/ErrorValidation'),
            new OA\Response(response: 429, ref: '#/components/responses/ErrorRateLimited'),
            new OA\Response(response: 500, ref: '#/components/responses/ErrorInternal'),

            new OA\Response(
                response: 200,
                description: 'Mettre a jour les preferences',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ApiSuccess',
                    example: [
                        'success' => true,
                        'data' => [
                            'stub' => true,
                            'message' => 'Mettre a jour les preferences',
                        ],
                        'meta' => [],
                    ]
                )
            ),
        ]
    )]
    public function preferencesPatch(): void {}

    /**
     * GET /api/v1/user/export
     *
     * Demarre un export des donnees associees au compte utilisateur.
     */
    #[OA\Get(
        path: '/user/export',
        tags: ['Profil'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(response: 400, ref: '#/components/responses/ErrorBadRequest'),
            new OA\Response(response: 401, ref: '#/components/responses/ErrorUnauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/ErrorForbidden'),
            new OA\Response(response: 404, ref: '#/components/responses/ErrorNotFound'),
            new OA\Response(response: 422, ref: '#/components/responses/ErrorValidation'),
            new OA\Response(response: 429, ref: '#/components/responses/ErrorRateLimited'),
            new OA\Response(response: 500, ref: '#/components/responses/ErrorInternal'),

            new OA\Response(
                response: 202,
                description: 'Exporter les donnees utilisateur',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ApiSuccess',
                    example: [
                        'success' => true,
                        'data' => [
                            'stub' => true,
                            'message' => 'Exporter les donnees utilisateur',
                        ],
                        'meta' => [],
                    ]
                )
            ),
        ]
    )]
    public function userExport(): void {}

    /**
     * DELETE /api/v1/user
     *
     * Supprime definitivement le compte de l'utilisateur et ses donnees personnelles.
     */
    #[OA\Delete(
        path: '/user',
        tags: ['Profil'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(response: 400, ref: '#/components/responses/ErrorBadRequest'),
            new OA\Response(response: 401, ref: '#/components/responses/ErrorUnauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/ErrorForbidden'),
            new OA\Response(response: 404, ref: '#/components/responses/ErrorNotFound'),
            new OA\Response(response: 422, ref: '#/components/responses/ErrorValidation'),
            new OA\Response(response: 429, ref: '#/components/responses/ErrorRateLimited'),
            new OA\Response(response: 500, ref: '#/components/responses/ErrorInternal'),

            new OA\Response(
                response: 200,
                description: 'Supprimer le compte utilisateur',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ApiSuccess',
                    example: [
                        'success' => true,
                        'data' => [
                            'message' => 'Compte supprime',
                        ],
                        'meta' => [],
                    ]
                )
            ),
        ]
    )]
    public function userDelete(): void {}
}

