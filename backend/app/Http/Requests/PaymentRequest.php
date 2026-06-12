<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'resident_id' => 'required|integer|exists:residents,id',
            'paid_at'     => 'required|date|before_or_equal:today',
            'bill_ids'    => 'required|array|min:1',
            'bill_ids.*'  => 'integer|exists:bills,id',
            'notes'       => 'nullable|string',
        ];
    }

    public function messages(): array
    {
        return [
            'resident_id.required' => 'Penghuni wajib dipilih.',
            'resident_id.exists'   => 'Penghuni tidak ditemukan.',
            'paid_at.required'     => 'Tanggal bayar wajib diisi.',
            'paid_at.before_or_equal' => 'Tanggal bayar tidak boleh di masa depan.',
            'bill_ids.required'    => 'Pilih minimal satu tagihan.',
            'bill_ids.min'         => 'Pilih minimal satu tagihan.',
            'bill_ids.*.exists'    => 'Salah satu tagihan tidak ditemukan.',
        ];
    }
}
