<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BillRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'house_id'    => 'required|integer|exists:houses,id',
            'fee_type_id' => 'required|integer|exists:fee_types,id',
            'year'        => 'required|integer|min:2000|max:2100',
            'month'       => 'required|integer|min:1|max:12',
            'amount'      => 'required|integer|min:1',
            'notes'       => 'nullable|string',
        ];
    }

    public function messages(): array
    {
        return [
            'house_id.required'    => 'Rumah wajib dipilih.',
            'house_id.exists'      => 'Rumah tidak ditemukan.',
            'fee_type_id.required' => 'Jenis iuran wajib dipilih.',
            'fee_type_id.exists'   => 'Jenis iuran tidak ditemukan.',
            'year.required'        => 'Tahun wajib diisi.',
            'month.required'       => 'Bulan wajib diisi.',
            'month.min'            => 'Bulan harus antara 1–12.',
            'month.max'            => 'Bulan harus antara 1–12.',
            'amount.required'      => 'Nominal tagihan wajib diisi.',
            'amount.min'           => 'Nominal tagihan minimal 1.',
        ];
    }
}
