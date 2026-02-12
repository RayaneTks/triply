<?php

namespace App\OpenApi;

use OpenApi\Attributes as OA;

final class V1Endpoints
{
    #[OA\Get(path: '/health', tags: ['Sante'], responses: [new OA\Response(response: 200, description: 'Sante', content: new OA\JsonContent(ref: '#/components/schemas/ApiSuccess', example: ['success' => true, 'data' => ['stub' => true, 'message' => 'Sante'], 'meta' => []]))])]
    public function health(): void {}

    #[OA\Post(path: '/auth/register', tags: ['Authentification'], requestBody: new OA\RequestBody(required: false, content: new OA\JsonContent(example: ['name' => 'Rayan', 'email' => 'rayan@example.com', 'password' => 'secret12345'])), responses: [new OA\Response(response: 201, description: 'Inscription', content: new OA\JsonContent(ref: '#/components/schemas/ApiSuccess', example: ['success' => true, 'data' => ['stub' => true, 'message' => 'Inscription'], 'meta' => []]))])]
    public function register(): void {}

    #[OA\Post(path: '/auth/login', tags: ['Authentification'], requestBody: new OA\RequestBody(required: false, content: new OA\JsonContent(example: ['email' => 'rayan@example.com', 'password' => 'secret12345', 'device_name' => 'web-chrome'])), responses: [new OA\Response(response: 200, description: 'Connexion', content: new OA\JsonContent(ref: '#/components/schemas/ApiSuccess', example: ['success' => true, 'data' => ['stub' => true, 'message' => 'Connexion'], 'meta' => []]))])]
    public function login(): void {}

    #[OA\Post(path: '/auth/logout', tags: ['Authentification'], security: [['bearerAuth' => []]], requestBody: new OA\RequestBody(required: false, content: new OA\JsonContent(example: ['todo' => 'Payload JSON provisoire (stub)'])), responses: [new OA\Response(response: 200, description: 'Deconnexion', content: new OA\JsonContent(ref: '#/components/schemas/ApiSuccess', example: ['success' => true, 'data' => ['stub' => true, 'message' => 'Deconnexion'], 'meta' => []]))])]
    public function logout(): void {}

    #[OA\Post(path: '/auth/forgot-password', tags: ['Authentification'], requestBody: new OA\RequestBody(required: false, content: new OA\JsonContent(example: ['email' => 'rayan@example.com'])), responses: [new OA\Response(response: 202, description: 'Mot de passe oublie', content: new OA\JsonContent(ref: '#/components/schemas/ApiSuccess', example: ['success' => true, 'data' => ['stub' => true, 'message' => 'Mot de passe oublie'], 'meta' => []]))])]
    public function forgotPassword(): void {}

    #[OA\Post(path: '/auth/reset-password', tags: ['Authentification'], requestBody: new OA\RequestBody(required: false, content: new OA\JsonContent(example: ['token' => 'reset-token', 'email' => 'rayan@example.com', 'password' => 'newsecret123', 'password_confirmation' => 'newsecret123'])), responses: [new OA\Response(response: 200, description: 'Reinitialiser le mot de passe', content: new OA\JsonContent(ref: '#/components/schemas/ApiSuccess', example: ['success' => true, 'data' => ['stub' => true, 'message' => 'Reinitialiser le mot de passe'], 'meta' => []]))])]
    public function resetPassword(): void {}

    #[OA\Get(path: '/auth/me', tags: ['Authentification'], security: [['bearerAuth' => []]], responses: [new OA\Response(response: 200, description: 'Utilisateur courant', content: new OA\JsonContent(ref: '#/components/schemas/ApiSuccess', example: ['success' => true, 'data' => ['stub' => true, 'message' => 'Utilisateur courant'], 'meta' => []]))])]
    public function me(): void {}

    #[OA\Post(path: '/auth/email/verify', tags: ['Authentification'], requestBody: new OA\RequestBody(required: false, content: new OA\JsonContent(example: ['id' => 'usr_stub_001', 'hash' => 'email-hash', 'signature' => 'signed-url-signature', 'expires' => 1735689600])), responses: [new OA\Response(response: 200, description: 'Verifier l\'email', content: new OA\JsonContent(ref: '#/components/schemas/ApiSuccess', example: ['success' => true, 'data' => ['stub' => true, 'message' => 'Verifier l\'email'], 'meta' => []]))])]
    public function verifyEmail(): void {}

    #[OA\Get(path: '/profile', tags: ['Profil'], security: [['bearerAuth' => []]], responses: [new OA\Response(response: 200, description: 'Profil', content: new OA\JsonContent(ref: '#/components/schemas/ApiSuccess', example: ['success' => true, 'data' => ['stub' => true, 'message' => 'Profil'], 'meta' => []]))])]
    public function profileGet(): void {}

    #[OA\Patch(path: '/profile', tags: ['Profil'], security: [['bearerAuth' => []]], requestBody: new OA\RequestBody(required: false, content: new OA\JsonContent(example: ['name' => 'Rayan K', 'photo_url' => 'https://cdn.triply.test/avatar.png', 'timezone' => 'Europe/Paris'])), responses: [new OA\Response(response: 200, description: 'Mettre a jour le profil', content: new OA\JsonContent(ref: '#/components/schemas/ApiSuccess', example: ['success' => true, 'data' => ['stub' => true, 'message' => 'Mettre a jour le profil'], 'meta' => []]))])]
    public function profilePatch(): void {}

    #[OA\Patch(path: '/profile/preferences', tags: ['Profil'], security: [['bearerAuth' => []]], requestBody: new OA\RequestBody(required: false, content: new OA\JsonContent(example: ['diet' => ['halal'], 'breakfast_included' => true, 'interests' => ['culture', 'food'], 'pace' => 'medium', 'max_budget' => 1200])), responses: [new OA\Response(response: 200, description: 'Mettre a jour les preferences', content: new OA\JsonContent(ref: '#/components/schemas/ApiSuccess', example: ['success' => true, 'data' => ['stub' => true, 'message' => 'Mettre a jour les preferences'], 'meta' => []]))])]
    public function preferencesPatch(): void {}

    #[OA\Get(path: '/user/export', tags: ['Profil'], security: [['bearerAuth' => []]], responses: [new OA\Response(response: 202, description: 'Exporter les donnees utilisateur', content: new OA\JsonContent(ref: '#/components/schemas/ApiSuccess', example: ['success' => true, 'data' => ['stub' => true, 'message' => 'Exporter les donnees utilisateur'], 'meta' => []]))])]
    public function userExport(): void {}

    #[OA\Delete(path: '/user', tags: ['Profil'], security: [['bearerAuth' => []]], responses: [new OA\Response(response: 200, description: 'Supprimer le compte utilisateur', content: new OA\JsonContent(ref: '#/components/schemas/ApiSuccess', example: ['success' => true, 'data' => ['stub' => true, 'message' => 'Supprimer le compte utilisateur'], 'meta' => []]))])]
    public function userDelete(): void {}

    #[OA\Post(path: '/trips', tags: ['Voyages'], security: [['bearerAuth' => []]], requestBody: new OA\RequestBody(required: false, content: new OA\JsonContent(example: ['title' => 'Tokyo 2026', 'destination' => 'Tokyo', 'start_date' => '2026-06-10', 'end_date' => '2026-06-18', 'travelers_count' => 2])), responses: [new OA\Response(response: 201, description: 'Creer un voyage', content: new OA\JsonContent(ref: '#/components/schemas/ApiSuccess', example: ['success' => true, 'data' => ['stub' => true, 'message' => 'Creer un voyage'], 'meta' => []]))])]
    public function tripStore(): void {}

    #[OA\Get(path: '/trips', tags: ['Voyages'], security: [['bearerAuth' => []]], responses: [new OA\Response(response: 200, description: 'Lister les voyages', content: new OA\JsonContent(ref: '#/components/schemas/ApiSuccess', example: ['success' => true, 'data' => ['stub' => true, 'message' => 'Lister les voyages'], 'meta' => []]))])]
    public function tripList(): void {}

    #[OA\Get(path: '/trips/{trip}', tags: ['Voyages'], security: [['bearerAuth' => []]], parameters: [new OA\Parameter(name: 'trip', in: 'path', required: true, schema: new OA\Schema(type: 'string'))], responses: [new OA\Response(response: 200, description: 'Detail du voyage', content: new OA\JsonContent(ref: '#/components/schemas/ApiSuccess', example: ['success' => true, 'data' => ['stub' => true, 'message' => 'Detail du voyage'], 'meta' => []]))])]
    public function tripShow(): void {}

    #[OA\Patch(path: '/trips/{trip}', tags: ['Voyages'], security: [['bearerAuth' => []]], parameters: [new OA\Parameter(name: 'trip', in: 'path', required: true, schema: new OA\Schema(type: 'string'))], requestBody: new OA\RequestBody(required: false, content: new OA\JsonContent(example: ['departure_location' => 'Paris', 'arrival_location' => 'Tokyo', 'timezone' => 'Asia/Tokyo', 'day_start_time' => '08:30', 'day_end_time' => '21:30', 'max_budget' => 2200])), responses: [new OA\Response(response: 200, description: 'Mettre a jour le voyage', content: new OA\JsonContent(ref: '#/components/schemas/ApiSuccess', example: ['success' => true, 'data' => ['stub' => true, 'message' => 'Mettre a jour le voyage'], 'meta' => []]))])]
    public function tripUpdate(): void {}

    #[OA\Post(path: '/trips/{trip}/duplicate', tags: ['Voyages'], security: [['bearerAuth' => []]], parameters: [new OA\Parameter(name: 'trip', in: 'path', required: true, schema: new OA\Schema(type: 'string'))], requestBody: new OA\RequestBody(required: false, content: new OA\JsonContent(example: ['todo' => 'Payload JSON provisoire (stub)'])), responses: [new OA\Response(response: 201, description: 'Dupliquer le voyage', content: new OA\JsonContent(ref: '#/components/schemas/ApiSuccess', example: ['success' => true, 'data' => ['stub' => true, 'message' => 'Dupliquer le voyage'], 'meta' => []]))])]
    public function tripDuplicate(): void {}

    #[OA\Post(path: '/trips/{trip}/validate', tags: ['Voyages'], security: [['bearerAuth' => []]], parameters: [new OA\Parameter(name: 'trip', in: 'path', required: true, schema: new OA\Schema(type: 'string'))], requestBody: new OA\RequestBody(required: false, content: new OA\JsonContent(example: ['todo' => 'Payload JSON provisoire (stub)'])), responses: [new OA\Response(response: 200, description: 'Valider le sejour', content: new OA\JsonContent(ref: '#/components/schemas/ApiSuccess', example: ['success' => true, 'data' => ['stub' => true, 'message' => 'Valider le sejour'], 'meta' => []]))])]
    public function tripValidate(): void {}

    #[OA\Get(path: '/trips/{trip}/days', tags: ['Journees'], security: [['bearerAuth' => []]], parameters: [new OA\Parameter(name: 'trip', in: 'path', required: true, schema: new OA\Schema(type: 'string'))], responses: [new OA\Response(response: 200, description: 'Lister les journees', content: new OA\JsonContent(ref: '#/components/schemas/ApiSuccess', example: ['success' => true, 'data' => ['stub' => true, 'message' => 'Lister les journees'], 'meta' => []]))])]
    public function daysList(): void {}

    #[OA\Patch(path: '/trips/{trip}/days/{day}', tags: ['Journees'], security: [['bearerAuth' => []]], parameters: [new OA\Parameter(name: 'trip', in: 'path', required: true, schema: new OA\Schema(type: 'string')), new OA\Parameter(name: 'day', in: 'path', required: true, schema: new OA\Schema(type: 'string'))], requestBody: new OA\RequestBody(required: false, content: new OA\JsonContent(example: ['available_minutes' => 540, 'start_time' => '09:00', 'end_time' => '18:00'])), responses: [new OA\Response(response: 200, description: 'Mettre a jour la journee', content: new OA\JsonContent(ref: '#/components/schemas/ApiSuccess', example: ['success' => true, 'data' => ['stub' => true, 'message' => 'Mettre a jour la journee'], 'meta' => []]))])]
    public function daysPatch(): void {}

    #[OA\Post(path: '/trips/{trip}/activities', tags: ['Activites'], security: [['bearerAuth' => []]], requestBody: new OA\RequestBody(required: false, content: new OA\JsonContent(example: ['source' => 'manual', 'title' => 'Asakusa', 'estimated_duration_minutes' => 90, 'cost' => 25, 'type' => 'culture'])), responses: [new OA\Response(response: 201, description: 'Ajouter une activite', content: new OA\JsonContent(ref: '#/components/schemas/ApiSuccess', example: ['success' => true, 'data' => ['stub' => true, 'message' => 'Ajouter une activite'], 'meta' => []]))])]
    public function activityStore(): void {}

    #[OA\Get(path: '/trips/{trip}/activities', tags: ['Activites'], security: [['bearerAuth' => []]], responses: [new OA\Response(response: 200, description: 'Lister les activites', content: new OA\JsonContent(ref: '#/components/schemas/ApiSuccess', example: ['success' => true, 'data' => ['stub' => true, 'message' => 'Lister les activites'], 'meta' => []]))])]
    public function activityList(): void {}

    #[OA\Get(path: '/trips/{trip}/activities/grouped-by-day', tags: ['Activites'], security: [['bearerAuth' => []]], responses: [new OA\Response(response: 200, description: 'Activites groupees par jour', content: new OA\JsonContent(ref: '#/components/schemas/ApiSuccess', example: ['success' => true, 'data' => ['stub' => true, 'message' => 'Activites groupees par jour'], 'meta' => []]))])]
    public function activityGrouped(): void {}

    #[OA\Get(path: '/trips/{trip}/activities/{activity}', tags: ['Activites'], security: [['bearerAuth' => []]], responses: [new OA\Response(response: 200, description: 'Detail activite', content: new OA\JsonContent(ref: '#/components/schemas/ApiSuccess', example: ['success' => true, 'data' => ['stub' => true, 'message' => 'Detail activite'], 'meta' => []]))])]
    public function activityShow(): void {}

    #[OA\Patch(path: '/trips/{trip}/activities/{activity}', tags: ['Activites'], security: [['bearerAuth' => []]], requestBody: new OA\RequestBody(required: false, content: new OA\JsonContent(example: ['estimated_duration_minutes' => 120, 'start_at' => '2026-06-11T09:30:00Z', 'liked_state' => 'liked', 'cost' => 30])), responses: [new OA\Response(response: 200, description: 'Mettre a jour l\'activite', content: new OA\JsonContent(ref: '#/components/schemas/ApiSuccess', example: ['success' => true, 'data' => ['stub' => true, 'message' => 'Mettre a jour l\'activite'], 'meta' => []]))])]
    public function activityUpdate(): void {}

    #[OA\Post(path: '/trips/{trip}/activities/{activity}/regenerate', tags: ['Activites'], security: [['bearerAuth' => []]], requestBody: new OA\RequestBody(required: false, content: new OA\JsonContent(example: ['todo' => 'Payload JSON provisoire (stub)'])), responses: [new OA\Response(response: 202, description: 'Regenerer l\'activite', content: new OA\JsonContent(ref: '#/components/schemas/ApiSuccess', example: ['success' => true, 'data' => ['stub' => true, 'message' => 'Regenerer l\'activite'], 'meta' => []]))])]
    public function activityRegenerate(): void {}

    #[OA\Post(path: '/trips/{trip}/activities/reorder', tags: ['Activites'], security: [['bearerAuth' => []]], requestBody: new OA\RequestBody(required: false, content: new OA\JsonContent(example: ['activity_ids' => ['act_stub_001', 'act_stub_002'], 'day_id' => 'day_stub_001'])), responses: [new OA\Response(response: 200, description: 'Reordonner les activites', content: new OA\JsonContent(ref: '#/components/schemas/ApiSuccess', example: ['success' => true, 'data' => ['stub' => true, 'message' => 'Reordonner les activites'], 'meta' => []]))])]
    public function activityReorder(): void {}

    #[OA\Delete(path: '/trips/{trip}/activities/{activity}', tags: ['Activites'], security: [['bearerAuth' => []]], responses: [new OA\Response(response: 200, description: 'Supprimer l\'activite', content: new OA\JsonContent(ref: '#/components/schemas/ApiSuccess', example: ['success' => true, 'data' => ['stub' => true, 'message' => 'Supprimer l\'activite'], 'meta' => []]))])]
    public function activityDelete(): void {}

    #[OA\Post(path: '/trips/{trip}/activities/{activity}/restore', tags: ['Activites'], security: [['bearerAuth' => []]], requestBody: new OA\RequestBody(required: false, content: new OA\JsonContent(example: ['estimated_duration_minutes' => 120, 'start_at' => '2026-06-11T09:30:00Z', 'liked_state' => 'liked', 'cost' => 30])), responses: [new OA\Response(response: 200, description: 'Restaurer l\'activite', content: new OA\JsonContent(ref: '#/components/schemas/ApiSuccess', example: ['success' => true, 'data' => ['stub' => true, 'message' => 'Restaurer l\'activite'], 'meta' => []]))])]
    public function activityRestore(): void {}

    #[OA\Get(path: '/places/{placeId}', tags: ['Lieux'], security: [['bearerAuth' => []]], responses: [new OA\Response(response: 200, description: 'Details du lieu', content: new OA\JsonContent(ref: '#/components/schemas/ApiSuccess', example: ['success' => true, 'data' => ['stub' => true, 'message' => 'Details du lieu'], 'meta' => []]))])]
    public function placeShow(): void {}

    #[OA\Get(path: '/places/{placeId}/reviews', tags: ['Lieux'], security: [['bearerAuth' => []]], responses: [new OA\Response(response: 200, description: 'Avis du lieu', content: new OA\JsonContent(ref: '#/components/schemas/ApiSuccess', example: ['success' => true, 'data' => ['stub' => true, 'message' => 'Avis du lieu'], 'meta' => []]))])]
    public function placeReviews(): void {}

    #[OA\Get(path: '/trips/{trip}/routes', tags: ['Lieux'], security: [['bearerAuth' => []]], responses: [new OA\Response(response: 200, description: 'Itineraires du voyage', content: new OA\JsonContent(ref: '#/components/schemas/ApiSuccess', example: ['success' => true, 'data' => ['stub' => true, 'message' => 'Itineraires du voyage'], 'meta' => []]))])]
    public function tripRoutes(): void {}

    #[OA\Get(path: '/trips/{trip}/travel-times', tags: ['Lieux'], security: [['bearerAuth' => []]], responses: [new OA\Response(response: 200, description: 'Temps de trajet', content: new OA\JsonContent(ref: '#/components/schemas/ApiSuccess', example: ['success' => true, 'data' => ['stub' => true, 'message' => 'Temps de trajet'], 'meta' => []]))])]
    public function tripTravelTimes(): void {}

    #[OA\Get(path: '/restaurants/nearby', tags: ['Lieux'], security: [['bearerAuth' => []]], responses: [new OA\Response(response: 200, description: 'Restaurants a proximite', content: new OA\JsonContent(ref: '#/components/schemas/ApiSuccess', example: ['success' => true, 'data' => ['stub' => true, 'message' => 'Restaurants a proximite'], 'meta' => []]))])]
    public function restaurantsNearby(): void {}

    #[OA\Post(path: '/ai/plan', tags: ['IA'], security: [['bearerAuth' => []]], requestBody: new OA\RequestBody(required: false, content: new OA\JsonContent(example: ['prompt' => 'Voyage 7 jours a Tokyo, budget modere, rythme medium', 'trip_id' => 'trip_stub_001', 'constraints' => ['max_budget' => 2200]])), responses: [new OA\Response(response: 202, description: 'Generer un plan', content: new OA\JsonContent(ref: '#/components/schemas/ApiSuccess', example: ['success' => true, 'data' => ['stub' => true, 'message' => 'Generer un plan'], 'meta' => []]))])]
    public function aiPlan(): void {}

    #[OA\Post(path: '/ai/trips/{trip}/days/{day}/generate', tags: ['IA'], security: [['bearerAuth' => []]], requestBody: new OA\RequestBody(required: false, content: new OA\JsonContent(example: ['options' => ['regenerate' => true, 'focus' => 'culture']])), responses: [new OA\Response(response: 202, description: 'Generer une journee', content: new OA\JsonContent(ref: '#/components/schemas/ApiSuccess', example: ['success' => true, 'data' => ['stub' => true, 'message' => 'Generer une journee'], 'meta' => []]))])]
    public function aiGenerateDay(): void {}

    #[OA\Post(path: '/ai/activities/{activity}/generate', tags: ['IA'], security: [['bearerAuth' => []]], requestBody: new OA\RequestBody(required: false, content: new OA\JsonContent(example: ['context' => ['reason' => 'Meteo pluvieuse', 'prefer_indoor' => true]])), responses: [new OA\Response(response: 202, description: 'Generer une activite', content: new OA\JsonContent(ref: '#/components/schemas/ApiSuccess', example: ['success' => true, 'data' => ['stub' => true, 'message' => 'Generer une activite'], 'meta' => []]))])]
    public function aiGenerateActivity(): void {}

    #[OA\Get(path: '/ai/jobs/{jobId}', tags: ['IA'], security: [['bearerAuth' => []]], responses: [new OA\Response(response: 200, description: 'Statut du job IA', content: new OA\JsonContent(ref: '#/components/schemas/ApiSuccess', example: ['success' => true, 'data' => ['stub' => true, 'message' => 'Statut du job IA'], 'meta' => []]))])]
    public function aiJobStatus(): void {}

    #[OA\Post(path: '/ai/jobs/{jobId}/cancel', tags: ['IA'], security: [['bearerAuth' => []]], requestBody: new OA\RequestBody(required: false, content: new OA\JsonContent(example: ['todo' => 'Payload JSON provisoire (stub)'])), responses: [new OA\Response(response: 200, description: 'Annuler le job IA', content: new OA\JsonContent(ref: '#/components/schemas/ApiSuccess', example: ['success' => true, 'data' => ['stub' => true, 'message' => 'Annuler le job IA'], 'meta' => []]))])]
    public function aiJobCancel(): void {}

    #[OA\Post(path: '/ai/qa', tags: ['IA'], security: [['bearerAuth' => []]], requestBody: new OA\RequestBody(required: false, content: new OA\JsonContent(example: ['question' => 'Que faire autour de Shibuya en 2h ?', 'trip_id' => 'trip_stub_001', 'conversation_id' => 'conv_stub_001'])), responses: [new OA\Response(response: 200, description: 'Questions hors itineraire', content: new OA\JsonContent(ref: '#/components/schemas/ApiSuccess', example: ['success' => true, 'data' => ['stub' => true, 'message' => 'Questions hors itineraire'], 'meta' => []]))])]
    public function aiQa(): void {}

    #[OA\Post(path: '/ai/branch', tags: ['IA'], security: [['bearerAuth' => []]], requestBody: new OA\RequestBody(required: false, content: new OA\JsonContent(example: ['conversation_id' => 'conv_stub_001', 'message_id' => 'msg_stub_009', 'reason' => 'Revenir a une proposition precedente'])), responses: [new OA\Response(response: 200, description: 'Creer une branche de conversation', content: new OA\JsonContent(ref: '#/components/schemas/ApiSuccess', example: ['success' => true, 'data' => ['stub' => true, 'message' => 'Creer une branche de conversation'], 'meta' => []]))])]
    public function aiBranch(): void {}

    #[OA\Get(path: '/trips/{trip}/flights', tags: ['Transports'], security: [['bearerAuth' => []]], responses: [new OA\Response(response: 200, description: 'Lister les vols', content: new OA\JsonContent(ref: '#/components/schemas/ApiSuccess', example: ['success' => true, 'data' => ['stub' => true, 'message' => 'Lister les vols'], 'meta' => []]))])]
    public function flightsList(): void {}

    #[OA\Post(path: '/trips/{trip}/flights', tags: ['Transports'], security: [['bearerAuth' => []]], requestBody: new OA\RequestBody(required: false, content: new OA\JsonContent(example: ['airline' => 'Air France', 'flight_number' => 'AF276', 'departure_at' => '2026-06-10T11:00:00Z', 'arrival_at' => '2026-06-11T03:30:00Z'])), responses: [new OA\Response(response: 201, description: 'Ajouter un vol', content: new OA\JsonContent(ref: '#/components/schemas/ApiSuccess', example: ['success' => true, 'data' => ['stub' => true, 'message' => 'Ajouter un vol'], 'meta' => []]))])]
    public function flightsCreate(): void {}

    #[OA\Patch(path: '/trips/{trip}/flights/{flight}', tags: ['Transports'], security: [['bearerAuth' => []]], requestBody: new OA\RequestBody(required: false, content: new OA\JsonContent(example: ['todo' => 'Payload JSON provisoire (stub)'])), responses: [new OA\Response(response: 200, description: 'Mettre a jour le vol', content: new OA\JsonContent(ref: '#/components/schemas/ApiSuccess', example: ['success' => true, 'data' => ['stub' => true, 'message' => 'Mettre a jour le vol'], 'meta' => []]))])]
    public function flightsUpdate(): void {}

    #[OA\Delete(path: '/trips/{trip}/flights/{flight}', tags: ['Transports'], security: [['bearerAuth' => []]], responses: [new OA\Response(response: 200, description: 'Supprimer le vol', content: new OA\JsonContent(ref: '#/components/schemas/ApiSuccess', example: ['success' => true, 'data' => ['stub' => true, 'message' => 'Supprimer le vol'], 'meta' => []]))])]
    public function flightsDelete(): void {}

    #[OA\Get(path: '/trips/{trip}/hotels', tags: ['Transports'], security: [['bearerAuth' => []]], responses: [new OA\Response(response: 200, description: 'Lister les hebergements', content: new OA\JsonContent(ref: '#/components/schemas/ApiSuccess', example: ['success' => true, 'data' => ['stub' => true, 'message' => 'Lister les hebergements'], 'meta' => []]))])]
    public function hotelsList(): void {}

    #[OA\Post(path: '/trips/{trip}/hotels', tags: ['Transports'], security: [['bearerAuth' => []]], requestBody: new OA\RequestBody(required: false, content: new OA\JsonContent(example: ['name' => 'Hotel Shinjuku', 'address' => '1-2-3 Shinjuku, Tokyo', 'check_in' => '2026-06-11', 'check_out' => '2026-06-18'])), responses: [new OA\Response(response: 201, description: 'Ajouter un hebergement', content: new OA\JsonContent(ref: '#/components/schemas/ApiSuccess', example: ['success' => true, 'data' => ['stub' => true, 'message' => 'Ajouter un hebergement'], 'meta' => []]))])]
    public function hotelsCreate(): void {}

    #[OA\Patch(path: '/trips/{trip}/hotels/{hotel}', tags: ['Transports'], security: [['bearerAuth' => []]], requestBody: new OA\RequestBody(required: false, content: new OA\JsonContent(example: ['todo' => 'Payload JSON provisoire (stub)'])), responses: [new OA\Response(response: 200, description: 'Mettre a jour l\'hebergement', content: new OA\JsonContent(ref: '#/components/schemas/ApiSuccess', example: ['success' => true, 'data' => ['stub' => true, 'message' => 'Mettre a jour l\'hebergement'], 'meta' => []]))])]
    public function hotelsUpdate(): void {}

    #[OA\Delete(path: '/trips/{trip}/hotels/{hotel}', tags: ['Transports'], security: [['bearerAuth' => []]], responses: [new OA\Response(response: 200, description: 'Supprimer l\'hebergement', content: new OA\JsonContent(ref: '#/components/schemas/ApiSuccess', example: ['success' => true, 'data' => ['stub' => true, 'message' => 'Supprimer l\'hebergement'], 'meta' => []]))])]
    public function hotelsDelete(): void {}

    #[OA\Get(path: '/trips/{trip}/local-transports', tags: ['Transports'], security: [['bearerAuth' => []]], responses: [new OA\Response(response: 200, description: 'Lister les transports locaux', content: new OA\JsonContent(ref: '#/components/schemas/ApiSuccess', example: ['success' => true, 'data' => ['stub' => true, 'message' => 'Lister les transports locaux'], 'meta' => []]))])]
    public function localTransportsList(): void {}

    #[OA\Post(path: '/trips/{trip}/local-transports', tags: ['Transports'], security: [['bearerAuth' => []]], requestBody: new OA\RequestBody(required: false, content: new OA\JsonContent(example: ['type' => 'metro', 'from' => 'Shibuya', 'to' => 'Asakusa', 'departure_at' => '2026-06-12T08:30:00Z', 'arrival_at' => '2026-06-12T09:10:00Z'])), responses: [new OA\Response(response: 201, description: 'Ajouter un transport local', content: new OA\JsonContent(ref: '#/components/schemas/ApiSuccess', example: ['success' => true, 'data' => ['stub' => true, 'message' => 'Ajouter un transport local'], 'meta' => []]))])]
    public function localTransportsCreate(): void {}

    #[OA\Patch(path: '/trips/{trip}/local-transports/{localTransport}', tags: ['Transports'], security: [['bearerAuth' => []]], requestBody: new OA\RequestBody(required: false, content: new OA\JsonContent(example: ['todo' => 'Payload JSON provisoire (stub)'])), responses: [new OA\Response(response: 200, description: 'Mettre a jour le transport local', content: new OA\JsonContent(ref: '#/components/schemas/ApiSuccess', example: ['success' => true, 'data' => ['stub' => true, 'message' => 'Mettre a jour le transport local'], 'meta' => []]))])]
    public function localTransportsUpdate(): void {}

    #[OA\Delete(path: '/trips/{trip}/local-transports/{localTransport}', tags: ['Transports'], security: [['bearerAuth' => []]], responses: [new OA\Response(response: 200, description: 'Supprimer le transport local', content: new OA\JsonContent(ref: '#/components/schemas/ApiSuccess', example: ['success' => true, 'data' => ['stub' => true, 'message' => 'Supprimer le transport local'], 'meta' => []]))])]
    public function localTransportsDelete(): void {}

    #[OA\Get(path: '/trips/{trip}/recap', tags: ['Partage'], security: [['bearerAuth' => []]], responses: [new OA\Response(response: 200, description: 'Recapitulatif du voyage', content: new OA\JsonContent(ref: '#/components/schemas/ApiSuccess', example: ['success' => true, 'data' => ['stub' => true, 'message' => 'Recapitulatif du voyage'], 'meta' => []]))])]
    public function recapPrivate(): void {}

    #[OA\Post(path: '/trips/{trip}/share', tags: ['Partage'], security: [['bearerAuth' => []]], requestBody: new OA\RequestBody(required: false, content: new OA\JsonContent(example: ['expires_at' => '2026-07-01T00:00:00Z', 'password' => 'share1234'])), responses: [new OA\Response(response: 201, description: 'Creer un lien de partage', content: new OA\JsonContent(ref: '#/components/schemas/ApiSuccess', example: ['success' => true, 'data' => ['stub' => true, 'message' => 'Creer un lien de partage'], 'meta' => []]))])]
    public function shareCreate(): void {}

    #[OA\Get(path: '/share/{token}', tags: ['Partage'], responses: [new OA\Response(response: 200, description: 'Recapitulatif public', content: new OA\JsonContent(ref: '#/components/schemas/ApiSuccess', example: ['success' => true, 'data' => ['stub' => true, 'message' => 'Recapitulatif public'], 'meta' => []]))])]
    public function sharePublic(): void {}

    #[OA\Post(path: '/trips/{trip}/export/pdf', tags: ['Exports'], security: [['bearerAuth' => []]], requestBody: new OA\RequestBody(required: false, content: new OA\JsonContent(example: ['locale' => 'fr', 'timezone' => 'Europe/Paris'])), responses: [new OA\Response(response: 202, description: 'Exporter en PDF', content: new OA\JsonContent(ref: '#/components/schemas/ApiSuccess', example: ['success' => true, 'data' => ['stub' => true, 'message' => 'Exporter en PDF'], 'meta' => []]))])]
    public function exportPdf(): void {}

    #[OA\Post(path: '/trips/{trip}/export/ics', tags: ['Exports'], security: [['bearerAuth' => []]], requestBody: new OA\RequestBody(required: false, content: new OA\JsonContent(example: ['locale' => 'fr', 'timezone' => 'Europe/Paris'])), responses: [new OA\Response(response: 202, description: 'Exporter en ICS', content: new OA\JsonContent(ref: '#/components/schemas/ApiSuccess', example: ['success' => true, 'data' => ['stub' => true, 'message' => 'Exporter en ICS'], 'meta' => []]))])]
    public function exportIcs(): void {}

    #[OA\Get(path: '/consent', tags: ['Consentement'], responses: [new OA\Response(response: 200, description: 'Recuperer le consentement', content: new OA\JsonContent(ref: '#/components/schemas/ApiSuccess', example: ['success' => true, 'data' => ['stub' => true, 'message' => 'Recuperer le consentement'], 'meta' => []]))])]
    public function consentGet(): void {}

    #[OA\Post(path: '/consent', tags: ['Consentement'], requestBody: new OA\RequestBody(required: false, content: new OA\JsonContent(example: ['analytics' => true, 'marketing' => false, 'functional' => true, 'version' => '2026.01'])), responses: [new OA\Response(response: 200, description: 'Enregistrer le consentement', content: new OA\JsonContent(ref: '#/components/schemas/ApiSuccess', example: ['success' => true, 'data' => ['stub' => true, 'message' => 'Enregistrer le consentement'], 'meta' => []]))])]
    public function consentPost(): void {}

    #[OA\Post(path: '/trips/{trip}/booking/checkout', tags: ['Reservation'], security: [['bearerAuth' => []]], requestBody: new OA\RequestBody(required: false, content: new OA\JsonContent(example: ['provider' => 'stripe', 'currency' => 'EUR', 'amount' => 499.99, 'items' => [['type' => 'hotel', 'id' => 'hotel_stub_001']]])), responses: [new OA\Response(response: 202, description: 'Paiement reservation (placeholder)', content: new OA\JsonContent(ref: '#/components/schemas/ApiSuccess', example: ['success' => true, 'data' => ['stub' => true, 'message' => 'Paiement reservation (placeholder)'], 'meta' => []]))])]
    public function bookingCheckout(): void {}

    #[OA\Get(path: '/admin/metrics', tags: ['Administration'], security: [['bearerAuth' => []]], responses: [new OA\Response(response: 200, description: 'Metriques', content: new OA\JsonContent(ref: '#/components/schemas/ApiSuccess', example: ['success' => true, 'data' => ['stub' => true, 'message' => 'Metriques'], 'meta' => []]))])]
    public function metrics(): void {}
}










