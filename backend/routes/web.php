<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/login', function () {
    $frontendUrl = rtrim((string) config('app.frontend_url', 'http://localhost:5173'), '/');

    return redirect()->away($frontendUrl.'/connexion');
})->name('login');
