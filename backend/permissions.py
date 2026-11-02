"""Role-based access control (RBAC) for RIVA.

Authorization model (Phase 2):
- Authentication is handled by auth.py (JWT tokens, get_current_user dependency).
- Authorization is handled here: once a user is authenticated, their role in a
  specific business determines what operations they can perform.

Roles:
- owner: Full access to the business, including deletion, settings, membership
- accountant: Read financial data + create/update financial records for accounting workflows
- viewer: Read-only access to permitted business data

Every business-scoped endpoint must verify:
1. The user is authenticated (via get_current_user)
2. The user has membership in the business (via BusinessMember or legacy owner_id)
3. The user's role permits the requested operation (enforced here)

Design principle: fail closed. Unknown roles, missing memberships, and
unrecognized operations are denied by default.
"""

from enum import Enum

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from models import Business, BusinessMember, User


# ---------------------------------------------------------------------------
# Role and permission definitions
# ---------------------------------------------------------------------------

class Role(str, Enum):
    """Business membership roles. Must match BusinessMember.role values."""
    OWNER = "owner"
    ACCOUNTANT = "accountant"
    VIEWER = "viewer"


class Permission(str, Enum):
    """Operations that can be authorized against a business."""
    # Business administration (owner-only)
    DELETE_BUSINESS = "delete_business"
    UPDATE_BUSINESS_SETTINGS = "update_business_settings"
    UPDATE_BUSINESS_CONTEXT = "update_business_context"
    MANAGE_MEMBERS = "manage_members"

    # Financial writes (owner + accountant)
    CREATE_JOURNAL_ENTRY = "create_journal_entry"
    UPDATE_JOURNAL_ENTRY = "update_journal_entry"
    DELETE_JOURNAL_ENTRY = "delete_journal_entry"
    CONFIRM_AI_TRANSACTION = "confirm_ai_transaction"

    # Financial reads (owner + accountant + viewer)
    READ_ACCOUNTS = "read_accounts"
    READ_TRANSACTIONS = "read_transactions"
    READ_REPORTS = "read_reports"
    READ_OVERVIEW = "read_overview"
    EXPORT_REPORTS = "export_reports"

    # Conversations (all roles can read/create; writes follow financial permissions)
    READ_CONVERSATIONS = "read_conversations"
    CREATE_CONVERSATION = "create_conversation"
    DELETE_CONVERSATION = "delete_conversation"


# Permission matrix: role → set of allowed permissions
_ROLE_PERMISSIONS: dict[Role, set[Permission]] = {
    Role.OWNER: {
        # Owners can do everything
        Permission.DELETE_BUSINESS,
        Permission.UPDATE_BUSINESS_SETTINGS,
        Permission.UPDATE_BUSINESS_CONTEXT,
        Permission.MANAGE_MEMBERS,
        Permission.CREATE_JOURNAL_ENTRY,
        Permission.UPDATE_JOURNAL_ENTRY,
        Permission.DELETE_JOURNAL_ENTRY,
        Permission.CONFIRM_AI_TRANSACTION,
        Permission.READ_ACCOUNTS,
        Permission.READ_TRANSACTIONS,
        Permission.READ_REPORTS,
        Permission.READ_OVERVIEW,
        Permission.EXPORT_REPORTS,
        Permission.READ_CONVERSATIONS,
        Permission.CREATE_CONVERSATION,
        Permission.DELETE_CONVERSATION,
    },
    Role.ACCOUNTANT: {
        # Accountants can work with financial data but not administer the business
        Permission.CREATE_JOURNAL_ENTRY,
        Permission.UPDATE_JOURNAL_ENTRY,
        Permission.CONFIRM_AI_TRANSACTION,
        Permission.READ_ACCOUNTS,
        Permission.READ_TRANSACTIONS,
        Permission.READ_REPORTS,
        Permission.READ_OVERVIEW,
        Permission.EXPORT_REPORTS,
        Permission.READ_CONVERSATIONS,
        Permission.CREATE_CONVERSATION,
        Permission.DELETE_CONVERSATION,
    },
    Role.VIEWER: {
        # Viewers can only read
        Permission.READ_ACCOUNTS,
        Permission.READ_TRANSACTIONS,
        Permission.READ_REPORTS,
        Permission.READ_OVERVIEW,
        Permission.EXPORT_REPORTS,
        Permission.READ_CONVERSATIONS,
        Permission.CREATE_CONVERSATION,
    },
}


def role_has_permission(role: str, permission: Permission) -> bool:
    """Check if a role grants a specific permission.

    Fails closed: unknown roles return False.
    """
    try:
        role_enum = Role(role)
    except ValueError:
        # Unknown role → deny
        return False

    return permission in _ROLE_PERMISSIONS.get(role_enum, set())


# ---------------------------------------------------------------------------
# Business membership and role resolution
# ---------------------------------------------------------------------------

def get_user_role(db: Session, user: User, business: Business) -> str | None:
    """Resolve the user's role for a specific business.

    Returns:
        Role string ("owner", "accountant", "viewer") if the user has membership.
        None if the user has no access to this business.

    Compatibility: if no BusinessMember record exists but the user is the
    legacy owner_id, they are treated as owner and a membership record is
    created automatically.
    """
    # Check for explicit membership
    membership = db.query(BusinessMember).filter(
        BusinessMember.business_id == business.id,
        BusinessMember.user_id == user.id,
    ).first()

    if membership:
        return membership.role

    # Backward compatibility: legacy owner_id without BusinessMember record
    if business.owner_id == user.id:
        # Auto-promote legacy owner to explicit owner membership
        db.add(BusinessMember(
            business_id=business.id,
            user_id=user.id,
            role=Role.OWNER.value,
        ))
        db.commit()
        return Role.OWNER.value

    # No membership
    return None


# ---------------------------------------------------------------------------
# Authorization enforcement
# ---------------------------------------------------------------------------

def require_business_access(
    db: Session,
    user: User,
    business: Business,
    permission: Permission,
) -> str:
    """Enforce that the user has the required permission for this business.

    Returns:
        The user's role (for logging or audit purposes).

    Raises:
        HTTPException(404) if the user has no membership.
        HTTPException(403) if the user lacks the required permission.

    Design: 404 for no-access prevents leaking business existence; 403 for
    insufficient permissions is clear to legitimate members.
    """
    role = get_user_role(db, user, business)

    if role is None:
        # No membership → 404 (don't leak that the business exists)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found",
        )

    if not role_has_permission(role, permission):
        # Has membership but insufficient permissions → 403
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Your role ({role}) does not permit this operation",
        )

    return role


def require_business_role(
    db: Session,
    user: User,
    business: Business,
    required_role: Role | list[Role],
) -> str:
    """Enforce that the user has one of the specified roles for this business.

    Convenience wrapper for role-based checks instead of permission-based.
    Example: require_business_role(db, user, business, Role.OWNER)

    Returns:
        The user's actual role.

    Raises:
        HTTPException(404) if the user has no membership.
        HTTPException(403) if the user's role is not in the required set.
    """
    role = get_user_role(db, user, business)

    if role is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found",
        )

    allowed = [required_role] if isinstance(required_role, Role) else required_role
    if role not in [r.value for r in allowed]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"This operation requires one of: {', '.join(r.value for r in allowed)}",
        )

    return role
