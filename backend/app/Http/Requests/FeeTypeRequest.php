<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class FeeTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $feeTypeId = $this->route('fee_type')?->id;

        return [
            'name'        => [
                'required',
                'string',
                'max:100',
                Rule::unique('fee_types', 'name')->ignore($feeTypeId),
            ],
            'amount'      => 'required|integer|min:1',
            'description' => 'nullable|string',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'   => 'Nama jenis iuran wajib diisi.',
            'name.unique'     => 'Nama jenis iuran sudah ada.',
            'amount.required' => 'Nominal iuran wajib diisi.',
            'amount.integer'  => 'Nominal iuran harus berupa angka.',
            'amount.min'      => 'Nominal iuran minimal 1.',
        ];
    }
}
