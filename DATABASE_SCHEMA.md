# FES Stories Database Schema Documentation

## Table of Contents

1. [users](#1-users)
2. [roles](#2-roles)
3. [permissions](#3-permissions)
4. [role_permissions](#4-role_permissions)
5. [regions](#5-regions)
6. [organizations](#6-organizations)
7. [story_categories](#7-story_categories)
8. [stories](#8-stories)
9. [sessions](#9-sessions)
10. [activities](#10-activities)
11. [category_regions](#11-category_regions)
12. [category_organizations](#12-category_organizations)
13. [migrations](#13-migrations)

---

## 1. users

### Schema

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `id` | BIGSERIAL | PRIMARY KEY | Auto-incrementing user ID |
| `name` | VARCHAR | NOT NULL | User's full name |
| `email` | VARCHAR | UNIQUE, NOT NULL | User's email address |
| `role_id` | BIGINT | FOREIGN KEY → `roles.id` | User's role |
| `organization_id` | BIGINT | FOREIGN KEY → `organizations.id`, NULLABLE | Organization the user belongs to |
| `region_id` | BIGINT | FOREIGN KEY → `regions.id`, NULLABLE | Region/State the user is associated with |
| `is_active` | BOOLEAN | DEFAULT true | Whether the user account is active |
| `created_at` | TIMESTAMP | | Account creation timestamp |
| `updated_at` | TIMESTAMP | | Last update timestamp |

---

## 2. roles

### Schema

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `id` | BIGSERIAL | PRIMARY KEY | Auto-incrementing role ID |
| `role_name` | VARCHAR | UNIQUE, NOT NULL | Role name (e.g., "Writer", "Editor", "Super Admin") |
| `created_at` | TIMESTAMP | | Role creation timestamp |
| `updated_at` | TIMESTAMP | | Last update timestamp |

---

## 3. permissions

### Schema

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `id` | BIGSERIAL | PRIMARY KEY | Auto-incrementing permission ID |
| `name` | VARCHAR | NOT NULL | Permission display name |
| `slug` | VARCHAR | UNIQUE, NOT NULL | Permission identifier |
| `description` | TEXT | NULLABLE | Permission description |
| `created_at` | TIMESTAMP | | Permission creation timestamp |
| `updated_at` | TIMESTAMP | | Last update timestamp |

---

## 4. role_permissions

### Schema

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `id` | BIGSERIAL | PRIMARY KEY | Auto-incrementing ID |
| `role_id` | BIGINT | FOREIGN KEY → `roles.id` | Role ID |
| `permission_id` | BIGINT | FOREIGN KEY → `permissions.id` | Permission ID |
| `created_at` | TIMESTAMP | | Relationship creation timestamp |
| `updated_at` | TIMESTAMP | | Last update timestamp |

---

## 5. regions

### Schema

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `id` | BIGSERIAL | PRIMARY KEY | Auto-incrementing region ID |
| `name` | VARCHAR(100) | UNIQUE, NOT NULL | State/Region name |
| `code` | VARCHAR(10) | UNIQUE, NULLABLE | State code (e.g., "MH", "KA") |
| `is_active` | BOOLEAN | DEFAULT true | Whether the region is active |
| `created_at` | TIMESTAMP | | Region creation timestamp |
| `updated_at` | TIMESTAMP | | Last update timestamp |

---

## 6. organizations

### Schema

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `id` | BIGSERIAL | PRIMARY KEY | Auto-incrementing organization ID |
| `name` | VARCHAR(255) | NOT NULL | Organization name |
| `region_id` | BIGINT | FOREIGN KEY → `regions.id` | Region/State where organization is located |
| `is_active` | BOOLEAN | DEFAULT true | Whether the organization is active |
| `created_at` | TIMESTAMP | | Organization creation timestamp |
| `updated_at` | TIMESTAMP | | Last update timestamp |

---

## 7. story_categories

### Schema

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `id` | BIGSERIAL | PRIMARY KEY | Auto-incrementing category ID |
| `name` | VARCHAR | NOT NULL | Category name |
| `description` | TEXT | NULLABLE | Category description |
| `is_active` | BOOLEAN | DEFAULT true | Whether the category is active |
| `created_at` | TIMESTAMP | | Category creation timestamp |
| `updated_at` | TIMESTAMP | | Last update timestamp |

---

## 8. stories

### Schema

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `id` | BIGSERIAL | PRIMARY KEY | Auto-incrementing story ID |
| `user_id` | BIGINT | FOREIGN KEY → `users.id`, NULLABLE | Author of the story |
| `category_id` | BIGINT | FOREIGN KEY → `story_categories.id`, NULLABLE | Story category |
| `title` | VARCHAR | NOT NULL | Story title |
| `slug` | VARCHAR | UNIQUE, NULLABLE | URL-friendly story identifier |
| `subtitle` | VARCHAR | NULLABLE | Story subtitle |
| `photo_url` | VARCHAR | NULLABLE | Photo URL for the person in the story |
| `quote` | TEXT | NULLABLE | Quote from the person |
| `person` | JSONB | NULLABLE | Person information (can have multiple persons or none). Stores array of person objects with all person-related fields |
| `facilitator` | JSONB | NULLABLE | Facilitator information (can have multiple facilitators or none). Stores array of facilitator objects with all facilitator-related fields |
| `state_id` | VARCHAR | NULLABLE | State ID from Admin Hierarchy API |
| `state_name` | VARCHAR | NULLABLE | State name |
| `district_id` | VARCHAR | NULLABLE | District ID from Admin Hierarchy API |
| `district_name` | VARCHAR | NULLABLE | District name |
| `sub_district_id` | VARCHAR | NULLABLE | Sub-district ID |
| `sub_district_name` | VARCHAR | NULLABLE | Sub-district name |
| `block_id` | VARCHAR | NULLABLE | Block ID |
| `block_name` | VARCHAR | NULLABLE | Block name |
| `panchayat_id` | VARCHAR | NULLABLE | Panchayat ID |
| `panchayat_name` | VARCHAR | NULLABLE | Panchayat name |
| `village_id` | VARCHAR | NULLABLE | Village ID |
| `village_name` | VARCHAR | NULLABLE | Village name |
| `latitude` | DECIMAL(10, 8) | NULLABLE | Latitude coordinate for map display |
| `longitude` | DECIMAL(11, 8) | NULLABLE | Longitude coordinate for map display |
| `description` | TEXT | NULLABLE | Story description/summary |
| `content` | TEXT | NULLABLE | Full story content |
| `status` | VARCHAR | DEFAULT 'pending' | Story status: 'pending', 'approved', 'rejected', 'published' |
| `approved_by` | BIGINT | FOREIGN KEY → `users.id`, NULLABLE | User who approved the story |
| `approved_at` | TIMESTAMP | NULLABLE | Approval timestamp |
| `published_at` | TIMESTAMP | NULLABLE | Publication timestamp |
| `rejection_reason` | TEXT | NULLABLE | Reason for rejection (if rejected) |
| `additional_fields` | JSONB | NULLABLE | Additional dynamic fields supporting text, hyperlinks, and YouTube embedded URLs |
| `created_at` | TIMESTAMP | | Story creation timestamp |
| `updated_at` | TIMESTAMP | | Last update timestamp |

### Person and Facilitator Fields (JSONB)

The following columns use JSONB to support multiple entries with all related fields:

- **`person`**: JSONB column storing array of person objects. Each person object contains all person-related fields (name, location, etc.). Can contain multiple persons or be empty/null.
- **`facilitator`**: JSONB column storing array of facilitator objects. Each facilitator object contains all facilitator-related fields (name, organization, etc.). Can contain multiple facilitators or be empty/null.

**Structure Example for Person Column:**
```json
[
  {
    "name": "John Smith",
    "location": "Mumbai, Maharashtra",
    "order": 1
  },
  {
    "name": "Jane Doe",
    "location": "Delhi, Delhi",
    "order": 2
  }
]
```

**Structure Example for Facilitator Column:**
```json
[
  {
    "name": "Dr. Rajesh Kumar",
    "organization": "FES Foundation",
    "order": 1
  },
  {
    "name": "Ms. Priya Sharma",
    "organization": "Community Development Org",
    "order": 2
  }
]
```

**Notes:**
- Both columns are nullable - stories can have no persons or facilitators
- Each array can contain multiple entries
- Each person/facilitator object contains all related fields together (name, location/organization, etc.)
- Each entry includes an order field (for display ordering)
- Arrays can be empty `[]` or null
- Additional fields can be added to person/facilitator objects as needed (e.g., email, phone, role, etc.)

---

### Additional Fields Column Details

The `additional_fields` JSONB column stores dynamic field data with the following supported data types:

- **text**: Plain text content
- **hyperlinks**: URL links (e.g., `https://example.com`)
- **youtube_embedded_url**: YouTube embedded URLs (e.g., `https://www.youtube.com/embed/VIDEO_ID`)

**Structure Example:**
```json
{
  "fields": [
    {
      "key": "person_1_name",
      "type": "text",
      "label": "Person Name",
      "value": "John Smith",
      "order": 1
    },
    {
      "key": "person_1_location",
      "type": "text",
      "label": "Person Location",
      "value": "Mumbai, Maharashtra",
      "order": 2
    },
    {
      "key": "person_2_name",
      "type": "text",
      "label": "Person Name",
      "value": "Jane Doe",
      "order": 3
    },
    {
      "key": "person_2_location",
      "type": "text",
      "label": "Person Location",
      "value": "Delhi, Delhi",
      "order": 4
    },
    {
      "key": "facilitator_1_name",
      "type": "text",
      "label": "Facilitator Name",
      "value": "Dr. Rajesh Kumar",
      "order": 5
    },
    {
      "key": "facilitator_1_organization",
      "type": "text",
      "label": "Facilitator Organization",
      "value": "FES Foundation",
      "order": 6
    },
    {
      "key": "facilitator_2_name",
      "type": "text",
      "label": "Facilitator Name",
      "value": "Ms. Priya Sharma",
      "order": 7
    },
    {
      "key": "facilitator_2_organization",
      "type": "text",
      "label": "Facilitator Organization",
      "value": "Community Development Org",
      "order": 8
    },
    {
      "key": "reference_link",
      "type": "hyperlinks",
      "label": "Reference Link",
      "value": "https://example.com/reference",
      "order": 9
    },
    {
      "key": "video_demo",
      "type": "youtube_embedded_url",
      "label": "Video Demo",
      "value": "https://www.youtube.com/embed/VIDEO_ID",
      "order": 10
    }
  ]
}
```

**Notes:**
- Multiple entries of each data type can be stored in the same column
- Each field entry includes: key (identifier), type (text/hyperlinks/youtube_embedded_url), label (display name), value (actual data), and order (display order)
- The column is nullable - stories can exist without additional fields
- **Person and Facilitator fields**: Previously static fields (`person_name`, `person_location`, `facilitator_name`, `facilitator_organization`) are now stored dynamically in `additional_fields`. This allows:
  - Multiple persons per story (e.g., `person_1_name`, `person_2_name`, etc.)
  - Multiple facilitators per story (e.g., `facilitator_1_name`, `facilitator_2_name`, etc.)
  - Stories with no persons or facilitators (simply omit these fields)
  - Flexible field naming and organization

---

## 9. sessions

### Schema

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `id` | VARCHAR(40) | PRIMARY KEY | Session ID (40-character string) |
| `user_id` | BIGINT | FOREIGN KEY → `users.id` | User associated with the session |
| `oauth_access_token` | TEXT | NOT NULL | Encrypted OAuth access token |
| `oauth_refresh_token` | TEXT | NULLABLE | Encrypted OAuth refresh token |
| `expires_at` | TIMESTAMP | NOT NULL | Access token expiration timestamp |
| `created_at` | TIMESTAMP | | Session creation timestamp |
| `updated_at` | TIMESTAMP | | Last update timestamp |

---

## 10. activities

### Schema

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `id` | BIGSERIAL | PRIMARY KEY | Auto-incrementing activity ID |
| `user_id` | BIGINT | FOREIGN KEY → `users.id`, NULLABLE | User who performed the activity |
| `type` | VARCHAR(50) | NOT NULL | Activity type (e.g., "login", "create", "edit", "delete") |
| `message` | TEXT | NOT NULL | Human-readable activity message |
| `metadata` | JSONB | NULLABLE | Additional activity data in JSON format |
| `created_at` | TIMESTAMP | | Activity timestamp |

---

## 11. category_regions

### Schema

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `id` | BIGSERIAL | PRIMARY KEY | Auto-incrementing ID |
| `category_id` | BIGINT | FOREIGN KEY → `story_categories.id` | Category ID |
| `region_id` | BIGINT | FOREIGN KEY → `regions.id` | Region ID |
| `created_at` | TIMESTAMP | | Relationship creation timestamp |
| `updated_at` | TIMESTAMP | | Last update timestamp |

---

## 12. category_organizations

### Schema

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `id` | BIGSERIAL | PRIMARY KEY | Auto-incrementing ID |
| `category_id` | BIGINT | FOREIGN KEY → `story_categories.id` | Category ID |
| `organization_id` | BIGINT | FOREIGN KEY → `organizations.id` | Organization ID |
| `created_at` | TIMESTAMP | | Relationship creation timestamp |
| `updated_at` | TIMESTAMP | | Last update timestamp |

---

## 13. migrations

### Schema

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `id` | BIGSERIAL | PRIMARY KEY | Auto-incrementing migration ID |
| `migration` | VARCHAR | NOT NULL | Migration file name |
| `batch` | INTEGER | NOT NULL | Migration batch number |

---

**Last Updated:** December 23, 2025
