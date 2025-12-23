# Dynamic Fields Strategy for Stories

## Problem Statement

Currently, the `stories` table has a fixed schema with predefined columns (title, subtitle, photo_url, quote, person_name, etc.). However, we need to allow users to add custom fields of different types when creating stories. This creates a challenge because:

1. **Database Schema**: We cannot predict what fields users will want to add
2. **Data Validation**: How do we validate dynamic fields without knowing their structure?
3. **Querying**: How do we efficiently query and filter by dynamic fields?
4. **Data Integrity**: How do we maintain data consistency with dynamic structures?

---

## Use Cases

### Scenario 1: Basic Story
A user creates a story with standard fields:
- Title, Subtitle, Photo, Quote, Person Name, Location

### Scenario 2: Story with Custom Fields
A user wants to add:
- "Crop Type" (text field)
- "Harvest Date" (date field)
- "Yield in Tons" (number field)
- "Weather Conditions" (text field)
- "Photos of Field" (multiple images)

### Scenario 3: Different Story Types
- **Education Story**: Needs fields like "School Name", "Grade Level", "Subject"
- **Health Story**: Needs fields like "Hospital Name", "Treatment Type", "Recovery Time"
- **Agriculture Story**: Needs fields like "Crop Type", "Season", "Irrigation Method"

---

## Database Design Approaches

### Approach 1: JSONB Column (PostgreSQL Native)

**Concept:**
Add a single `custom_fields` JSONB column to the `stories` table to store all dynamic fields.

**Structure:**
```json
{
  "crop_type": "Wheat",
  "harvest_date": "2025-03-15",
  "yield_tons": 45.5,
  "weather_conditions": "Sunny",
  "field_photos": ["url1", "url2"]
}
```

**Pros:**
- Simple schema change (one column)
- Flexible - can store any structure
- PostgreSQL JSONB is optimized for querying
- Can index specific JSON paths
- No additional tables needed
- Easy to add/remove fields without migrations

**Cons:**
- No built-in type validation at database level
- Harder to query specific fields (requires JSON path syntax)
- No foreign key relationships possible
- Schema is not self-documenting
- Potential for inconsistent field names across stories

---

### Approach 2: Separate Dynamic Fields Table

**Concept:**
Create a `story_dynamic_fields` table with a key-value structure.

**Table Structure:**
- `id` (primary key)
- `story_id` (foreign key to stories)
- `field_key` (the field name/identifier)
- `field_type` (text, number, date, boolean, json, etc.)
- `field_value` (the actual value stored as text or JSON)
- `display_order` (for ordering fields)
- `created_at`, `updated_at`

**Pros:**
- Normalized database structure
- Easy to query specific field types
- Can add metadata per field (type, order, validation rules)
- Can track field history if needed
- Supports relationships (if field_value stores IDs)

**Cons:**
- More complex queries (joins required)
- More database operations (multiple inserts/updates)
- Potential performance issues with many fields
- Requires more storage space

---

### Approach 3: Hybrid Approach (Fixed + JSONB)

**Concept:**
Keep existing fixed columns for common fields, add JSONB for truly dynamic fields.

**Structure:**
- Standard fields: title, subtitle, photo_url, quote, etc. (as they are now)
- `custom_fields` JSONB column for additional dynamic fields

**Pros:**
- Best of both worlds
- Common fields remain easily queryable
- Dynamic fields provide flexibility
- Can migrate frequently used custom fields to fixed columns later

**Cons:**
- Slight complexity in knowing which fields are where
- Need logic to determine field location

---

### Approach 4: Field Definition + Field Values (Two-Table Approach)

**Concept:**
Create two tables:
1. `story_field_definitions` - Defines available field types and their metadata
2. `story_field_values` - Stores actual field values for each story

**Table 1: story_field_definitions**
- `id`, `field_key`, `field_label`, `field_type`, `validation_rules`, `is_required`, `default_value`, `display_order`

**Table 2: story_field_values**
- `id`, `story_id`, `field_definition_id`, `field_value`, `created_at`, `updated_at`

**Pros:**
- Highly structured and controlled
- Field definitions can be reused across stories
- Strong validation capabilities
- Can define field templates/categories
- Supports field versioning

**Cons:**
- Most complex implementation
- Requires field definition management
- Less flexible for truly ad-hoc fields
- More database overhead

---

## Recommended Approach

### Database: Hybrid (Fixed + JSONB)

**Rationale:**
- Keep existing fixed columns for common, queryable fields
- Add `custom_fields` JSONB column for dynamic data
- Best balance of performance, flexibility, and simplicity
- Can query common fields efficiently
- Can store any structure in JSONB

**Implementation:**
- Add `custom_fields JSONB NULLABLE` to stories table
- Add GIN index on custom_fields for efficient querying
- Store field metadata (type, label) within JSON structure

---

## Data Structure Examples

### JSONB Structure (Recommended)

```json
{
  "fields": [
    {
      "key": "crop_type",
      "type": "text",
      "label": "Crop Type",
      "value": "Wheat",
      "order": 1
    },
    {
      "key": "harvest_date",
      "type": "date",
      "label": "Harvest Date",
      "value": "2025-03-15",
      "order": 2
    },
    {
      "key": "yield_tons",
      "type": "number",
      "label": "Yield (Tons)",
      "value": 45.5,
      "order": 3
    },
    {
      "key": "field_photos",
      "type": "array",
      "label": "Field Photos",
      "value": ["url1", "url2", "url3"],
      "order": 4
    }
  ],
  "metadata": {
    "template": "agriculture",
    "version": "1.0"
  }
}
```

---

## Creating and Storing Custom Fields

### Example: Creating a "Helper Name" Text Field

When you create a custom field called "Helper Name" with type "text" and a value, here's how it would be structured and stored:

#### Step 1: Field Definition

When creating the field, you define:
- **Field Key**: `helper_name` (internal identifier, lowercase with underscores)
- **Field Label**: `Helper Name` (display name shown to users)
- **Field Type**: `text` (data type)
- **Field Value**: `"John Smith"` (the actual value)

#### Step 2: JSONB Structure

The field would be added to the `custom_fields` JSONB column in this format:

```json
{
  "fields": [
    {
      "key": "helper_name",
      "type": "text",
      "label": "Helper Name",
      "value": "John Smith",
      "order": 1
    }
  ]
}
```

#### Step 3: Complete Example with Multiple Fields

If a story has multiple custom fields including "Helper Name":

```json
{
  "fields": [
    {
      "key": "helper_name",
      "type": "text",
      "label": "Helper Name",
      "value": "John Smith",
      "order": 1
    },
    {
      "key": "helper_phone",
      "type": "text",
      "label": "Helper Phone",
      "value": "+91-9876543210",
      "order": 2
    },
    {
      "key": "helper_email",
      "type": "text",
      "label": "Helper Email",
      "value": "john.smith@example.com",
      "order": 3
    }
  ],
  "metadata": {
    "template": null,
    "version": "1.0"
  }
}
```

---

### Field Structure Breakdown

Each field object contains:

| Property | Description | Example | Required |
|----------|-------------|---------|----------|
| `key` | Internal identifier (lowercase, underscores) | `helper_name` | Yes |
| `type` | Data type of the field | `text`, `number`, `date`, `boolean`, `array` | Yes |
| `label` | Display name shown to users | `Helper Name` | Yes |
| `value` | The actual field value | `"John Smith"` | Yes |
| `order` | Display order (for sorting) | `1`, `2`, `3` | Optional |

---

### Field Type Examples

#### Text Field
```json
{
  "key": "helper_name",
  "type": "text",
  "label": "Helper Name",
  "value": "John Smith",
  "order": 1
}
```

#### Image Link Field (Single Image URL)
```json
{
  "key": "helper_photo",
  "type": "text",
  "label": "Helper Photo",
  "value": "https://example.com/images/helper-photo.jpg",
  "order": 1
}
```

**Note:** For a single image, you can use `type: "text"` and store the URL as a string. The URL should be validated to ensure it's a valid image URL format.

#### Number Field
```json
{
  "key": "helper_age",
  "type": "number",
  "label": "Helper Age",
  "value": 35,
  "order": 2
}
```

#### Date Field
```json
{
  "key": "helper_join_date",
  "type": "date",
  "label": "Helper Join Date",
  "value": "2025-01-15",
  "order": 3
}
```

#### Boolean Field
```json
{
  "key": "helper_is_active",
  "type": "boolean",
  "label": "Helper Is Active",
  "value": true,
  "order": 4
}
```

#### Array Field (for multiple values)
```json
{
  "key": "helper_skills",
  "type": "array",
  "label": "Helper Skills",
  "value": ["Teaching", "Cooking", "Gardening"],
  "order": 5
}
```

#### Image Link Field (Single Image)
```json
{
  "key": "helper_photo",
  "type": "text",
  "label": "Helper Photo",
  "value": "https://example.com/images/helper-photo.jpg",
  "order": 6
}
```

#### Image Links Field (Multiple Images)
```json
{
  "key": "helper_photos",
  "type": "array",
  "label": "Helper Photos",
  "value": [
    "https://example.com/images/helper-photo-1.jpg",
    "https://example.com/images/helper-photo-2.jpg",
    "https://example.com/images/helper-photo-3.jpg"
  ],
  "order": 7
}
```

#### Image Link with Metadata (Advanced)
```json
{
  "key": "helper_gallery",
  "type": "array",
  "label": "Helper Photo Gallery",
  "value": [
    {
      "url": "https://example.com/images/helper-photo-1.jpg",
      "caption": "Helper at work",
      "alt": "Helper working in field"
    },
    {
      "url": "https://example.com/images/helper-photo-2.jpg",
      "caption": "Helper with community",
      "alt": "Helper with local community members"
    }
  ],
  "order": 8
}
```

---

### Database Storage

When this data is stored in PostgreSQL:

**Table: stories**
- `id`: 123
- `title`: "Story Title"
- `custom_fields`: `{"fields": [{"key": "helper_name", "type": "text", "label": "Helper Name", "value": "John Smith", "order": 1}]}`

The `custom_fields` column stores the entire JSONB structure, and you can query it using JSONB operators.

---

### Querying the Custom Field

To find stories with a specific helper name:

```sql
-- Find stories where helper_name equals "John Smith"
SELECT * FROM stories 
WHERE custom_fields->'fields' @> '[{"key": "helper_name", "value": "John Smith"}]';

-- Find stories where helper_name contains "John"
SELECT * FROM stories 
WHERE custom_fields->'fields' @> '[{"key": "helper_name"}]'
AND custom_fields->'fields'->0->>'value' LIKE '%John%';
```

---

### Adding a New Custom Field to Existing Story

When adding "Helper Name" to an existing story:

1. **Fetch current custom_fields** (may be null or empty)
2. **Parse existing fields** (if any)
3. **Add new field object** to the fields array
4. **Update order** values if needed
5. **Save back to database**

**Before:**
```json
{
  "fields": [
    {
      "key": "crop_type",
      "type": "text",
      "label": "Crop Type",
      "value": "Wheat",
      "order": 1
    }
  ]
}
```

**After adding Helper Name:**
```json
{
  "fields": [
    {
      "key": "crop_type",
      "type": "text",
      "label": "Crop Type",
      "value": "Wheat",
      "order": 1
    },
    {
      "key": "helper_name",
      "type": "text",
      "label": "Helper Name",
      "value": "John Smith",
      "order": 2
    }
  ]
}
```

---

## Validation Strategy

### Field-Level Validation
- Type validation (text, number, date, boolean, etc.)
- Required field validation
- Format validation (email, URL, phone number)
- Range validation (min/max for numbers, date ranges)
- Custom regex patterns
- Image URL validation (must be valid URL, check file extensions: .jpg, .jpeg, .png, .gif, .webp)
- Image URL accessibility (verify URL is accessible, not broken)
- Image URL validation (must be valid URL, check file extensions: .jpg, .jpeg, .png, .gif, .webp)
- Image URL accessibility (verify URL is accessible, not broken)

### Storage-Level Validation
- JSON schema validation before storing
- Field key naming conventions
- Maximum number of custom fields per story
- Maximum field value length

---

## Querying Considerations

### Common Queries
- Get all stories with a specific custom field value
- Filter stories by custom field value
- Search within custom fields
- Aggregate data from custom fields

### PostgreSQL JSONB Queries
- Use `->` and `->>` operators for JSON path queries
- Create GIN indexes on specific JSON paths
- Use JSONB functions for complex queries

**Example Queries:**

```sql
-- Find stories with specific custom field value
SELECT * FROM stories 
WHERE custom_fields->'fields' @> '[{"key": "crop_type", "value": "Wheat"}]';

-- Find stories with custom field containing text
SELECT * FROM stories 
WHERE custom_fields->>'fields' LIKE '%Wheat%';

-- Index for efficient querying
CREATE INDEX idx_stories_custom_fields ON stories USING GIN (custom_fields);
```

---

## Migration Path

### Phase 1: Add JSONB Column
- Add `custom_fields JSONB NULLABLE` to stories table
- Add GIN index for performance
- Keep existing fixed columns unchanged
- Backfill existing stories with null custom_fields

### Phase 2: Backend API Support
- Update story model to handle custom_fields
- Add validation for custom_fields structure
- Update create/update endpoints to accept custom_fields
- Add query support for filtering by custom fields

### Phase 3: Field Templates (Optional)
- Create field template management (if using templates)
- Add category-based field templates
- Allow admins to define templates

### Phase 4: Enhanced Features (Future)
- Field validation rules
- Field relationships
- Field versioning
- Field analytics

---

## Security Considerations

### Input Validation
- Sanitize all custom field inputs
- Validate JSON structure before storing
- Prevent injection attacks
- Limit field key names to safe characters
- Validate field values based on type

### Access Control
- Who can add custom fields? (All users, Editors only, Admins only?)
- Can users modify field definitions?
- Field-level permissions?
- Validate user permissions before allowing custom field modifications

### Data Privacy
- Ensure custom fields follow same privacy rules as standard fields
- Consider PII in custom fields
- Compliance with data regulations
- Audit logging for custom field access

---

## Performance Considerations

### Indexing
- GIN index on JSONB column for efficient queries
- Consider indexing frequently queried JSON paths
- Monitor index size and query performance
- Use partial indexes for specific field queries

**Example Indexes:**
```sql
-- General GIN index for all JSONB queries
CREATE INDEX idx_stories_custom_fields ON stories USING GIN (custom_fields);

-- Index on specific JSON path (if frequently queried)
CREATE INDEX idx_stories_crop_type ON stories 
USING GIN ((custom_fields->'fields'->0->>'value'))
WHERE custom_fields->'fields'->0->>'key' = 'crop_type';
```

### Storage
- JSONB is compressed but can grow large
- Consider field limits (max fields per story, max value size)
- Archive old stories with many custom fields if needed
- Monitor database size growth

### Query Optimization
- Optimize JSON path queries
- Use materialized views for common aggregations
- Cache frequently accessed custom field structures
- Consider denormalization for heavily queried fields

---

## Data Integrity

### Consistency
- Ensure field keys are consistent across stories (if using templates)
- Validate field types match declared types
- Handle missing or null custom_fields gracefully
- Maintain backward compatibility with stories created before dynamic fields

### Constraints
- Maximum number of custom fields per story
- Maximum size of custom_fields JSONB
- Field key naming conventions (alphanumeric, underscores, etc.)
- Required vs optional custom fields

---

## Backup and Recovery

### Considerations
- JSONB data included in standard database backups
- Test restore procedures with custom_fields data
- Consider export format for custom_fields
- Version control for field structure changes

---

## Future Enhancements

### Advanced Features
- Field relationships (e.g., show field B only if field A has value X)
- Conditional field validation
- Field calculations (e.g., auto-calculate totals)
- Field dependencies
- Multi-language field labels

### Integration
- Export custom fields to reports
- API access to custom fields
- Integration with external systems
- Custom field analytics
- Field migration tools

---

## Conclusion

The recommended approach provides a balance between flexibility and performance:

1. **Database**: Hybrid approach with fixed columns + JSONB for custom fields
2. **Validation**: Type-based validation with JSON schema
3. **Querying**: Efficient JSONB queries with proper indexing
4. **Performance**: GIN indexes for fast JSONB queries

This strategy allows the system to:
- Maintain performance for common fields
- Provide flexibility for custom use cases
- Scale to new requirements
- Maintain data integrity

---

**Last Updated:** December 22, 2025
