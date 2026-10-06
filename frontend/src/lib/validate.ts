export type Errors = Record<string, string>

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const text = (data: FormData, key: string) => String(data.get(key) ?? '').trim()

function checkEmail(data: FormData, errors: Errors) {
  if (!EMAIL.test(text(data, 'email'))) errors.email = 'Enter a valid email address.'
}

export function validateLogin(data: FormData): Errors {
  const errors: Errors = {}
  checkEmail(data, errors)
  if (!text(data, 'password')) errors.password = 'Enter your password.'
  return errors
}

export function validateRegister(data: FormData): Errors {
  const errors: Errors = {}
  if (!text(data, 'name')) errors.name = 'Enter your full name.'
  if (!text(data, 'barangay')) errors.barangay = 'Enter your barangay.'
  checkEmail(data, errors)
  if (text(data, 'password').length < 8) errors.password = 'Use at least 8 characters.'
  if (!data.get('terms')) errors.terms = 'Accept the terms to continue.'
  return errors
}
