<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * User Seeder
 * 
 * Seeds the database with test users for development and testing.
 */
class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run(): void
    {
        $users = [
            [
                'name' => 'Vyom',
                'email' => 'vyom@example.com',
                'password' => Hash::make('123'),
            ],
            [
                'name' => 'Krina',
                'email' => 'krina@example.com',
                'password' => Hash::make('123'),
            ],
        ];

        foreach ($users as $user) {
            User::create($user);
        }

        $this->command->info('Successfully created ' . count($users) . ' users!');
        $this->command->info('Users:');
        $this->command->info('  - vyom@example.com / 123');
        $this->command->info('  - krina@example.com / 123');
    }
}

