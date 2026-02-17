<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

abstract class BaseApiRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'success' => false,
            'error' => [
                'code' => 'VALIDATION_ERROR',
                'message' => 'Requete invalide',
                'details' => $validator->errors()->toArray(),
            ],
        ], 422));
    }

    public function messages(): array
    {
        return [
            'required' => 'Ce champ est obligatoire.',
            'string' => 'Ce champ doit etre une chaine de caracteres.',
            'email' => 'Adresse email invalide.',
            'min' => 'La valeur est trop courte.',
            'max' => 'La valeur est trop longue.',
            'confirmed' => 'La confirmation ne correspond pas.',
            'unique' => 'Cette valeur est deja utilisee.',
            'integer' => 'Ce champ doit etre un entier.',
            'boolean' => 'Ce champ doit etre vrai ou faux.',
            'array' => 'Ce champ doit etre un tableau.',
            'date' => 'Ce champ doit etre une date valide.',
            'in' => 'La valeur fournie est invalide.',
            'exists' => 'La ressource associee est introuvable.',
        ];
    }
}
