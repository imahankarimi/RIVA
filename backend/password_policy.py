"""Password policy and validation for RIVA authentication.

Shared validation applied consistently across signup, password reset, and
authenticated password change. Phase 2B requirement: one reusable function,
no duplicate logic.
"""

import re


class PasswordValidationError(ValueError):
    """Raised when a password fails validation."""
    pass


def validate_password(password: str) -> None:
    """Validate password meets security requirements.

    Requirements:
    - Minimum 8 characters
    - Maximum 128 characters (bcrypt limit)
    - At least one letter (prevents pure numeric passwords)

    Raises:
        PasswordValidationError: If password doesn't meet requirements
    """
    if not isinstance(password, str):
        raise PasswordValidationError("Password must be a string")

    if len(password) < 8:
        raise PasswordValidationError("Password must be at least 8 characters")

    if len(password) > 128:
        raise PasswordValidationError("Password must be at most 128 characters")

    # Require at least one letter to prevent pure numeric passwords
    if not re.search(r'[a-zA-Z]', password):
        raise PasswordValidationError("Password must contain at least one letter")

    # Additional weak password checks
    if password.lower() in {
        'password', 'password1', 'password123', '12345678',
        'qwerty', 'abc123', 'letmein', 'welcome', 'admin',
    }:
        raise PasswordValidationError("Password is too common")
