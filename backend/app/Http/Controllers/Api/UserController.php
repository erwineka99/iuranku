<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    // GET /api/users — daftar semua user
    public function index(): JsonResponse
    {
        $users = User::with('resident')->get();

        return response()->json([
            'data' => $users->map(fn ($u) => [
                'id'         => $u->id,
                'name'       => $u->name,
                'email'      => $u->email,
                'role'       => $u->role,
                'resident'   => $u->resident ? [
                    'id'        => $u->resident->id,
                    'full_name' => $u->resident->full_name,
                    'phone'     => $u->resident->phone,
                ] : null,
                'created_at' => $u->created_at,
            ]),
        ]);
    }

    // POST /api/users — tambah user admin baru
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'role'     => ['required', Rule::in(['super_admin', 'admin'])],
        ]);

        $user = User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => Hash::make($data['password']),
            'role'     => $data['role'],
        ]);

        return response()->json([
            'message' => 'User berhasil ditambahkan',
            'data'    => [
                'id'         => $user->id,
                'name'       => $user->name,
                'email'      => $user->email,
                'role'       => $user->role,
                'created_at' => $user->created_at,
            ],
        ], 201);
    }

    // PUT /api/users/{user} — update role atau reset password
    public function update(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'role'     => ['sometimes', Rule::in(['super_admin', 'admin', 'resident'])],
            'password' => 'sometimes|string|min:6',
        ]);

        if (isset($data['role'])) {
            $user->role = $data['role'];
        }

        if (isset($data['password'])) {
            $user->password = Hash::make($data['password']);
            // cabut semua token agar sesi lama tidak valid setelah reset password
            $user->tokens()->delete();
        }

        $user->save();

        return response()->json([
            'message' => 'User berhasil diperbarui',
            'data'    => [
                'id'         => $user->id,
                'name'       => $user->name,
                'email'      => $user->email,
                'role'       => $user->role,
                'updated_at' => $user->updated_at,
            ],
        ]);
    }

    // DELETE /api/users/{user} — hapus user
    public function destroy(Request $request, User $user): JsonResponse
    {
        if ($request->user()->id === $user->id) {
            return response()->json(['message' => 'Tidak bisa menghapus akun sendiri'], 422);
        }

        $user->tokens()->delete();
        $user->delete();

        return response()->json(['message' => 'User berhasil dihapus']);
    }
}
