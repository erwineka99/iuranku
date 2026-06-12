<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class HouseResidentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'resident_id' => 'required|integer|exists:residents,id',
            'moved_in_at' => 'required|date|before_or_equal:today',
            'notes'       => 'nullable|string',
        ];
    }

    public function messages(): array
    {
        return [
            'resident_id.required' => 'Penghuni wajib dipilih.',
            'resident_id.exists'   => 'Penghuni tidak ditemukan.',
            'moved_in_at.required' => 'Tanggal masuk wajib diisi.',
            'moved_in_at.date'     => 'Format tanggal masuk tidak valid.',
            'moved_in_at.before_or_equal' => 'Tanggal masuk tidak boleh di masa depan.',
        ];
    }
}
