<?php

return [
    'openai' => [
        'api_key' => env('OPENAI_API_KEY'),
        'model' => env('OPENAI_CHAT_MODEL', 'gpt-4o-mini'),
        'base_url' => rtrim(env('OPENAI_BASE_URL', 'https://api.openai.com/v1'), '/'),
    ],
    'amadeus' => [
        'base_url' => rtrim(env('AMADEUS_BASE_URL', 'https://test.api.amadeus.com'), '/'),
        'client_id' => env('AMADEUS_CLIENT_ID'),
        'client_secret' => env('AMADEUS_CLIENT_SECRET'),
    ],
    'google_places' => [
        'api_key' => env('GOOGLE_PLACES_API_KEY'),
    ],
];
