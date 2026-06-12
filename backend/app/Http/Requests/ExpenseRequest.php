<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ExpenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category'     => 'required|string|max:100',
            'description'  => 'required|string|max:255',
            'amount'       => 'required|integer|min:1',
            'expense_date' => 'required|date',
            'notes'        => 'nullable|string',
        ];
    }

    public function messages(): array
    {
        return [
            'category.required'     => 'Kategori pengeluaran wajib diisi.',
            'description.required'  => 'Keterangan pengeluaran wajib diisi.',
            'amount.required'       => 'Nominal pengeluaran wajib diisi.',
            'amount.min'            => 'Nominal pengeluaran minimal 1.',
            'expense_date.required' => 'Tanggal pengeluaran wajib diisi.',
            'expense_date.date'     => 'Format tanggal pengeluaran tidak valid.',
        ];
    }
}
