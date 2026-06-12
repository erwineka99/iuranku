<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class HouseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $houseId = $this->route('house')?->id;

        return [
            'number' => [
                'required',
                'string',
                'max:10',
                // kombinasi number+block harus unik, kecuali untuk rumah yang sedang diedit
                Rule::unique('houses')->where('block', $this->block)->ignore($houseId),
            ],
            'block'       => 'required|string|max:5',
            'address'     => 'required|string|max:255',
            'description' => 'nullable|string',
        ];
    }

    public function messages(): array
    {
        return [
            'number.required' => 'Nomor rumah wajib diisi.',
            'number.unique'   => 'Kombinasi nomor dan blok rumah sudah digunakan.',
            'block.required'  => 'Blok rumah wajib diisi.',
            'address.required'=> 'Alamat wajib diisi.',
        ];
    }
}
