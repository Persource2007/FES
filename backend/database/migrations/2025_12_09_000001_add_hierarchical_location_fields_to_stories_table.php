<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Add Hierarchical Location Fields to Stories Table Migration
 * 
 * Adds hierarchical location fields (state_id, district_id, sub_district_id, block_id, panchayat_id, village_id)
 * from the Admin Hierarchy API to replace the simple state/city text fields.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('stories', function (Blueprint $table) {
            // Add hierarchical location fields after city
            $table->string('state_id')->nullable()->after('city');
            $table->string('state_name')->nullable()->after('state_id');
            $table->string('district_id')->nullable()->after('state_name');
            $table->string('district_name')->nullable()->after('district_id');
            $table->string('sub_district_id')->nullable()->after('district_name');
            $table->string('sub_district_name')->nullable()->after('sub_district_id');
            $table->string('block_id')->nullable()->after('sub_district_name');
            $table->string('block_name')->nullable()->after('block_id');
            $table->string('panchayat_id')->nullable()->after('block_name');
            $table->string('panchayat_name')->nullable()->after('panchayat_id');
            $table->string('village_id')->nullable()->after('panchayat_name');
            $table->string('village_name')->nullable()->after('village_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stories', function (Blueprint $table) {
            $table->dropColumn([
                'state_id',
                'state_name',
                'district_id',
                'district_name',
                'sub_district_id',
                'sub_district_name',
                'block_id',
                'block_name',
                'panchayat_id',
                'panchayat_name',
                'village_id',
                'village_name',
            ]);
        });
    }
};

