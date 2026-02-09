<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use OpenApi\Attributes as OA;

class AuthController extends Controller
{
    #[OA\Post(
        path: '/api/v1/auth/register',
        summary: 'Creer un nouveau compte utilisateur',
        tags: ['Authentification'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['name', 'email', 'password'],
                properties: [
                    new OA\Property(property: 'name', type: 'string', example: 'Rayan'),
                    new OA\Property(property: 'email', type: 'string', format: 'email', example: 'rayan@example.com'),
                    new OA\Property(property: 'password', type: 'string', format: 'password', example: 'secret123'),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Compte cree',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string', example: "Endpoint d'inscription pret"),
                    ]
                )
            ),
        ]
    )]
    public function register(): JsonResponse
    {
        return response()->json(['message' => "Endpoint d'inscription pret"], 201);
    }

    #[OA\Post(
        path: '/api/v1/auth/login',
        summary: 'Authentifier un utilisateur',
        tags: ['Authentification'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['email', 'password'],
                properties: [
                    new OA\Property(property: 'email', type: 'string', format: 'email', example: 'rayan@example.com'),
                    new OA\Property(property: 'password', type: 'string', format: 'password', example: 'secret123'),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "Resultat de l'authentification",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string', example: 'Endpoint de connexion pret'),
                        new OA\Property(property: 'token', type: 'string', nullable: true, example: 'token-placeholder'),
                    ]
                )
            ),
        ]
    )]
    public function login(): JsonResponse
    {
        return response()->json([
            'message' => 'Endpoint de connexion pret',
            'token' => 'token-placeholder',
        ]);
    }

    #[OA\Post(
        path: '/api/v1/auth/logout',
        summary: "Deconnecter l'utilisateur courant",
        tags: ['Authentification'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Resultat de la deconnexion',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string', example: 'Endpoint de deconnexion pret'),
                    ]
                )
            ),
        ]
    )]
    public function logout(): JsonResponse
    {
        return response()->json(['message' => 'Endpoint de deconnexion pret']);
    }

    #[OA\Get(
        path: '/api/v1/auth/me',
        summary: "Recuperer l'utilisateur authentifie courant",
        tags: ['Authentification'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Utilisateur courant',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'id', type: 'integer', example: 1),
                        new OA\Property(property: 'name', type: 'string', example: 'Rayan'),
                        new OA\Property(property: 'email', type: 'string', format: 'email', example: 'rayan@example.com'),
                    ]
                )
            ),
        ]
    )]
    public function me(): JsonResponse
    {
        return response()->json([
            'id' => 1,
            'name' => 'Rayan',
            'email' => 'rayan@example.com',
        ]);
    }
}
