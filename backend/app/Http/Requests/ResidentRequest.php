<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ResidentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $residentId = $this->route('resident')?->id;

        return [
            'full_name'     => 'required|string|max:255',
            'phone'         => [
                'required',
                'string',
                'max:20',
                Rule::unique('residents', 'phone')->ignore($residentId),
            ],
            'resident_type' => 'required|in:permanent,contract',
            'is_married'    => 'required|boolean',
            'ktp_photo'     => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
        ];
    }

    public function messages(): array
    {
        return [
            'full_name.required'     => 'Nama lengkap wajib diisi.',
            'phone.required'         => 'Nomor telepon wajib diisi.',
            'phone.unique'           => 'Nomor telepon sudah digunakan.',
            'phone.max'              => 'Nomor telepon maksimal 20 karakter.',
            'resident_type.required' => 'Tipe penghuni wajib diisi.',
            'resident_type.in'       => 'Tipe penghuni harus permanent atau contract.',
            'is_married.required'    => 'Status pernikahan wajib diisi.',
            'is_married.boolean'     => 'Status pernikahan harus true atau false.',
            'ktp_photo.image'        => 'File KTP harus berupa gambar.',
            'ktp_photo.mimes'        => 'Format foto KTP harus jpg, jpeg, atau png.',
            'ktp_photo.max'          => 'Ukuran foto KTP maksimal 2MB.',
        ];
    }
}
