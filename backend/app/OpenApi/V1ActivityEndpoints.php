<?php

namespace App\OpenApi;

use OpenApi\Attributes as OA;

/**
 * Endpoints lies aux etapes / activites (`etapes`).
 *
 * Creation, listing, edition, suppression et restauration d'activites
 * pour une journee donnee.
 */
final class V1ActivityEndpoints
{
    /**
     * POST /api/v1/trips/{trip}/activities
     *
     * Cree une nouvelle etape (activite) rattachee a une journee de voyage.
     */
    #[OA\Post(
        path: '/trips/{trip}/activities',
        tags: ['Activites'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                example: [
                    'journee_id' => 10,
                    'titre' => 'Visite du temple Senso-ji',
                    'temps_estime' => '01:30',
                    'prix_estime' => 25,
                    'ville' => 'Tokyo',
                    'pays' => 'Japon',
                    'description' => 'Matinee dans le quartier d\'Asakusa',
                    'source_lien' => 'https://example.com/sensoji',
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Ajouter une etape',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ApiSuccess',
                    example: [
                        'success' => true,
                        'data' => [
                            'etape' => [
                                'id' => 100,
                                'journee_id' => 10,
                                'titre' => 'Visite du temple Senso-ji',
                                'temps_estime' => '01:30',
                                'prix_estime' => 25,
                                'ville' => 'Tokyo',
                                'pays' => 'Japon',
                            ],
                        ],
                        'meta' => [],
                    ]
                )
            ),
        ]
    )]
    public function activityStore(): void {}

    /**
     * GET /api/v1/trips/{trip}/activities
     *
     * Liste les etapes d'un voyage (eventuellement filtrees par jour / type).
     */
    #[OA\Get(
        path: '/trips/{trip}/activities',
        tags: ['Activites'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Lister les activites',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ApiSuccess',
                    example: [
                        'success' => true,
                        'data' => [
                            'stub' => true,
                            'message' => 'Lister les activites',
                        ],
                        'meta' => [],
                    ]
                )
            ),
        ]
    )]
    public function activityList(): void {}

    /**
     * GET /api/v1/trips/{trip}/activities/grouped-by-day
     *
     * Retourne les activites groupees par journee pour un voyage.
     */
    #[OA\Get(
        path: '/trips/{trip}/activities/grouped-by-day',
        tags: ['Activites'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Activites groupees par jour',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ApiSuccess',
                    example: [
                        'success' => true,
                        'data' => [
                            'stub' => true,
                            'message' => 'Activites groupees par jour',
                        ],
                        'meta' => [],
                    ]
                )
            ),
        ]
    )]
    public function activityGrouped(): void {}

    /**
     * GET /api/v1/trips/{trip}/activities/{activity}
     *
     * Retourne le detail d'une etape specifique.
     */
    #[OA\Get(
        path: '/trips/{trip}/activities/{activity}',
        tags: ['Activites'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Detail activite',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ApiSuccess',
                    example: [
                        'success' => true,
                        'data' => [
                            'stub' => true,
                            'message' => 'Detail activite',
                        ],
                        'meta' => [],
                    ]
                )
            ),
        ]
    )]
    public function activityShow(): void {}

    /**
     * PATCH /api/v1/trips/{trip}/activities/{activity}
     *
     * Met a jour les informations d'une etape (duree, cout, horaire...).
     */
    #[OA\Patch(
        path: '/trips/{trip}/activities/{activity}',
        tags: ['Activites'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: false,
            content: new OA\JsonContent(
                example: [
                    'estimated_duration_minutes' => 120,
                    'start_at' => '2026-06-11T09:30:00Z',
                    'liked_state' => 'liked',
                    'cost' => 30,
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Mettre a jour l\'activite',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ApiSuccess',
                    example: [
                        'success' => true,
                        'data' => [
                            'stub' => true,
                            'message' => 'Mettre a jour l\'activite',
                        ],
                        'meta' => [],
                    ]
                )
            ),
        ]
    )]
    public function activityUpdate(): void {}

    /**
     * POST /api/v1/trips/{trip}/activities/{activity}/regenerate
     *
     * Demande une nouvelle suggestion d'activite (via IA ou logique metier).
     */
    #[OA\Post(
        path: '/trips/{trip}/activities/{activity}/regenerate',
        tags: ['Activites'],
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
                response: 202,
                description: 'Regenerer l\'activite',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ApiSuccess',
                    example: [
                        'success' => true,
                        'data' => [
                            'stub' => true,
                            'message' => 'Regenerer l\'activite',
                        ],
                        'meta' => [],
                    ]
                )
            ),
        ]
    )]
    public function activityRegenerate(): void {}

    /**
     * POST /api/v1/trips/{trip}/activities/reorder
     *
     * Change l'ordre des activites pour une journee ou un voyage.
     */
    #[OA\Post(
        path: '/trips/{trip}/activities/reorder',
        tags: ['Activites'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: false,
            content: new OA\JsonContent(
                example: [
                    'activity_ids' => ['act_stub_001', 'act_stub_002'],
                    'day_id' => 'day_stub_001',
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Reordonner les activites',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ApiSuccess',
                    example: [
                        'success' => true,
                        'data' => [
                            'stub' => true,
                            'message' => 'Reordonner les activites',
                        ],
                        'meta' => [],
                    ]
                )
            ),
        ]
    )]
    public function activityReorder(): void {}

    /**
     * DELETE /api/v1/trips/{trip}/activities/{activity}
     *
     * Supprime (souvent soft-delete) une etape d'un voyage.
     */
    #[OA\Delete(
        path: '/trips/{trip}/activities/{activity}',
        tags: ['Activites'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Supprimer l\'activite',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ApiSuccess',
                    example: [
                        'success' => true,
                        'data' => [
                            'stub' => true,
                            'message' => 'Supprimer l\'activite',
                        ],
                        'meta' => [],
                    ]
                )
            ),
        ]
    )]
    public function activityDelete(): void {}

    /**
     * POST /api/v1/trips/{trip}/activities/{activity}/restore
     *
     * Restaure une activite precedemment supprimee.
     */
    #[OA\Post(
        path: '/trips/{trip}/activities/{activity}/restore',
        tags: ['Activites'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: false,
            content: new OA\JsonContent(
                example: [
                    'estimated_duration_minutes' => 120,
                    'start_at' => '2026-06-11T09:30:00Z',
                    'liked_state' => 'liked',
                    'cost' => 30,
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Restaurer l\'activite',
                content: new OA\JsonContent(
                    ref: '#/components/schemas/ApiSuccess',
                    example: [
                        'success' => true,
                        'data' => [
                            'stub' => true,
                            'message' => 'Restaurer l\'activite',
                        ],
                        'meta' => [],
                    ]
                )
            ),
        ]
    )]
    public function activityRestore(): void {}
}
