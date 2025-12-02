# Components Documentation

This directory contains reusable React components used throughout the application.

## Components

### TextInput

A flexible input component with validation, icons, and error display.

**Props:**
- `type` (string): Input type (text, email, password, etc.) - default: 'text'
- `name` (string, required): Input name attribute
- `value` (string, required): Input value
- `onChange` (function, required): Change handler
- `placeholder` (string): Placeholder text
- `label` (string): Label text (optional)
- `error` (string): Error message to display
- `icon` (elementType): React icon component (optional)
- `required` (boolean): Whether field is required - default: false
- `autoComplete` (string): Autocomplete attribute
- `disabled` (boolean): Whether input is disabled - default: false
- `className` (string): Additional CSS classes

**Example:**
```jsx
import { TextInput } from '../components'
import { FaEnvelope } from 'react-icons/fa'

<TextInput
  type="email"
  name="email"
  value={email}
  onChange={handleChange}
  placeholder="Enter your email"
  label="Email Address"
  icon={FaEnvelope}
  error={errors.email}
  required
/>
```

### Button

A flexible button component with loading state, variants, and sizes.

**Props:**
- `type` (string): Button type (button, submit, reset) - default: 'button'
- `onClick` (function): Click handler
- `loading` (boolean): Whether button is in loading state - default: false
- `disabled` (boolean): Whether button is disabled - default: false
- `variant` (string): Button style variant (primary, secondary, danger) - default: 'primary'
- `size` (string): Button size (sm, md, lg) - default: 'md'
- `className` (string): Additional CSS classes
- `children` (node, required): Button content

**Example:**
```jsx
import { Button } from '../components'

<Button
  type="submit"
  loading={isLoading}
  variant="primary"
  size="lg"
  className="w-full"
>
  Submit
</Button>
```

### PasswordStrength

Displays a visual indicator of password strength based on various criteria.

**Props:**
- `password` (string): The password to evaluate

**Example:**
```jsx
import { PasswordStrength } from '../components'

<PasswordStrength password={password} />
```

### LoginForm

A complete, production-ready login form with validation, password visibility toggle, remember me functionality, and password strength indicator.

**Props:**
- `onSubmit` (function): Callback function when form is submitted
- `isLoading` (boolean): External loading state (optional)

**Example:**
```jsx
import { LoginForm } from '../components'

const handleSubmit = async (formData) => {
  console.log('Form data:', formData)
  // Your API call here
}

<LoginForm onSubmit={handleSubmit} isLoading={false} />
```

**Form Data Structure:**
```javascript
{
  email: string,
  password: string,
  rememberMe: boolean
}
```

## Usage

### Import Individual Components

```jsx
import TextInput from '../components/TextInput'
import Button from '../components/Button'
```

### Import from Index (Recommended)

```jsx
import { TextInput, Button, LoginForm } from '../components'
```

## Features

- ✅ Full TypeScript/PropTypes support
- ✅ Accessibility (ARIA labels, keyboard navigation)
- ✅ Responsive design
- ✅ Error handling and validation
- ✅ Loading states
- ✅ Customizable styling with Tailwind CSS
- ✅ Focus states and transitions

