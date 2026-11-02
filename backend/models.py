import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class Business(Base):
    __tablename__ = "businesses"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    language: Mapped[str] = mapped_column(
        String(2),
        nullable=False,
        default="fa",
    )

    base_currency: Mapped[str] = mapped_column(
        String(5),
        nullable=False,
        default="IRR",
    )

    # Free-form context the owner provides once ("I run a small food store,
    # I sell packaged food and nuts, I keep inventory...") — given to the AI
    # assistant as background so it can classify ambiguous requests (e.g. an
    # inventory purchase vs. a generic expense) more sensibly. It is never
    # used to construct or validate a transaction by itself: every AI action
    # still goes through the normal accounting validation regardless of what
    # this context says.
    context_text: Mapped[str | None] = mapped_column(Text, nullable=True)

    # The user that created/owns this business. A user can own several
    # businesses; `User.business_id` below just tracks which one is
    # currently selected in the UI.
    owner_id: Mapped[str | None] = mapped_column(
        ForeignKey("users.id"),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    owner: Mapped["User | None"] = relationship(
        back_populates="owned_businesses",
        foreign_keys=[owner_id],
    )

    accounts: Mapped[list["Account"]] = relationship(
        back_populates="business",
        cascade="all, delete-orphan",
    )

    journal_entries: Mapped[list["JournalEntry"]] = relationship(
        back_populates="business",
        cascade="all, delete-orphan",
    )

    conversations: Mapped[list["ChatConversation"]] = relationship(
        back_populates="business",
        cascade="all, delete-orphan",
    )


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    email: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        unique=True,
        index=True,
    )

    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    first_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    last_name: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Currently-selected business. Not unique any more — a user can own
    # (and switch between) multiple businesses.
    business_id: Mapped[str] = mapped_column(
        ForeignKey("businesses.id"),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    # Email verification status (Phase 2B)
    is_verified: Mapped[bool] = mapped_column(
        default=False,
        nullable=False,
    )

    # Restored from HEAD: Business.owner back_populates owned_businesses,
    # and auth response builders read user.business.
    business: Mapped["Business"] = relationship(
        foreign_keys=[business_id],
    )

    owned_businesses: Mapped[list["Business"]] = relationship(
        back_populates="owner",
        foreign_keys="Business.owner_id",
        cascade="all, delete-orphan",
    )

    @property
    def full_name(self) -> str | None:
        parts = [p for p in (self.first_name, self.last_name) if p]
        return " ".join(parts) if parts else None


class BusinessMember(Base):
    """Membership relationship between users and businesses.

    Replaces the simple `Business.owner_id` for authorization purposes.
    A user can belong to multiple businesses with different roles.

    Roles:
        owner - Full access to the business
        accountant - Can work with financial data but not owner-level admin
        viewer - Read-only access to permitted business data
    """

    __tablename__ = "business_members"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    business_id: Mapped[str] = mapped_column(
        ForeignKey("businesses.id"),
        nullable=False,
    )

    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
    )

    role: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )  # "owner", "accountant", "viewer"

    created_at: Mapped[datetime] = mapped_column(
        default=datetime.utcnow,
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    # Constraints
    __table_args__ = (
        # One user can only have one role per business
        UniqueConstraint("business_id", "user_id", name="uq_business_member"),
        # Index for fast membership lookups
        Index("ix_business_members_business_id", "business_id"),
        Index("ix_business_members_user_id", "user_id"),
        Index("ix_business_members_role", "role"),
    )

    # Relationships
    business: Mapped["Business"] = relationship(
        "Business", foreign_keys=[business_id]
    )

    user: Mapped["User"] = relationship(
        "User", foreign_keys=[user_id]
    )


class Account(Base):
    __tablename__ = "accounts"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    business_id: Mapped[str] = mapped_column(
        ForeignKey("businesses.id"),
        nullable=False,
    )

    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    account_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    code: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    business: Mapped["Business"] = relationship(
        back_populates="accounts",
    )

    journal_lines: Mapped[list["JournalLine"]] = relationship(
        back_populates="account",
    )


class JournalEntry(Base):
    __tablename__ = "journal_entries"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    business_id: Mapped[str] = mapped_column(
        ForeignKey("businesses.id"),
        nullable=False,
    )

    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    transaction_date: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    currency: Mapped[str] = mapped_column(
        String(5),
        nullable=False,
        default="IRR",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    business: Mapped["Business"] = relationship(
        back_populates="journal_entries",
    )

    lines: Mapped[list["JournalLine"]] = relationship(
        back_populates="journal_entry",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        CheckConstraint(
            "currency IN ('IRR', 'TOMAN', 'USD', 'EUR', 'GBP')",
            name="ck_journal_entries_currency",
        ),
    )


class JournalLine(Base):
    __tablename__ = "journal_lines"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    journal_entry_id: Mapped[str] = mapped_column(
        ForeignKey("journal_entries.id"),
        nullable=False,
    )

    account_id: Mapped[str] = mapped_column(
        ForeignKey("accounts.id"),
        nullable=False,
    )

    debit: Mapped[Decimal] = mapped_column(
        Numeric(20, 2),
        nullable=False,
        default=Decimal("0"),
    )

    credit: Mapped[Decimal] = mapped_column(
        Numeric(20, 2),
        nullable=False,
        default=Decimal("0"),
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    journal_entry: Mapped["JournalEntry"] = relationship(
        back_populates="lines",
    )

    account: Mapped["Account"] = relationship(
        back_populates="journal_lines",
    )

    __table_args__ = (
        CheckConstraint(
            "debit >= 0 AND credit >= 0",
            name="ck_journal_lines_non_negative",
        ),
        CheckConstraint(
            "NOT (debit > 0 AND credit > 0)",
            name="ck_journal_lines_not_both",
        ),
    )


class ChatConversation(Base):
    __tablename__ = "chat_conversations"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    business_id: Mapped[str] = mapped_column(
        ForeignKey("businesses.id"),
        nullable=False,
        index=True,
    )

    title: Mapped[str | None] = mapped_column(String(255), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    business: Mapped["Business"] = relationship(back_populates="conversations")

    messages: Mapped[list["ChatMessageRow"]] = relationship(
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="ChatMessageRow.created_at",
    )


class ChatMessageRow(Base):
    """A single turn in an AI Assistant conversation (persisted, not local state)."""

    __tablename__ = "chat_messages"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    conversation_id: Mapped[str] = mapped_column(
        ForeignKey("chat_conversations.id"),
        nullable=False,
        index=True,
    )

    role: Mapped[str] = mapped_column(String(16), nullable=False)  # "user" | "assistant"
    msg_type: Mapped[str] = mapped_column(String(32), nullable=False)  # text/transaction/error/...
    content: Mapped[str] = mapped_column(Text, nullable=False)
    action_json: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    conversation: Mapped["ChatConversation"] = relationship(back_populates="messages")


class AuditLog(Base):
    """Append-only audit log for financial and security-sensitive changes.

    Stores an immutable audit trail of who did what, when, and why.
    Protected from ordinary users modifying or deleting their own history.

    Fields:
        - user_id: The authenticated user who performed the action
        - business_id: The business the action relates to (if applicable)
        - action: The type of action (create, update, delete, login, logout, etc.)
        - resource_type: The type of resource affected (transaction, account, business, user, etc.)
        - resource_id: The ID of the specific resource affected
        - timestamp: When the action occurred
        - previous_value: The value before the change (for updates/deletes)
        - new_value: The value after the change (for updates/deletes)
        - metadata: Additional context (IP address, user agent, etc.)
    """

    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
    )

    business_id: Mapped[str | None] = mapped_column(
        ForeignKey("businesses.id"),
        nullable=True,
    )

    action: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )  # e.g., "transaction_create", "user_login", "password_change"

    resource_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )  # e.g., "transaction", "account", "business", "user"

    resource_id: Mapped[str | None] = mapped_column(
        String(36),
        nullable=True,
    )

    timestamp: Mapped[datetime] = mapped_column(
        default=datetime.utcnow,
        nullable=False,
    )

    previous_value: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    new_value: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # "metadata" is a reserved name on declarative classes (cls.metadata is
    # the MetaData registry), so the attribute is metadata_json while the
    # database column stays "metadata".
    metadata_json: Mapped[str | None] = mapped_column(
        "metadata",
        Text,
        nullable=True,
    )

    # Relationships
    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])
    business: Mapped["Business | None"] = relationship(
        "Business", foreign_keys=[business_id]
    )


class UserSession(Base):
    """Server-side session for refresh-token rotation and revocation.

    The database is the authoritative revocation store (works across all
    backend workers/processes — no in-memory state). A refresh token is only
    accepted while its session row is active AND the token's JTI matches the
    session's current_jti. Rotation rewrites current_jti; presenting an older
    JTI is reuse detection and revokes the whole session.
    """

    __tablename__ = "user_sessions"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    # JTI of the currently-valid refresh token for this session.
    current_jti: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    # Absolute session expiry (naive UTC). Refresh rotation never extends it.
    expires_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
    )

    last_refreshed_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    revoked_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    revoke_reason: Mapped[str | None] = mapped_column(
        String(64),
        nullable=True,
    )  # e.g. "logout", "refresh_reuse", "password_reset"

    # Informational metadata only (never used as a security boundary).
    user_agent: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    ip_address: Mapped[str | None] = mapped_column(
        String(64),
        nullable=True,
    )

    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])

    __table_args__ = (
        UniqueConstraint("current_jti", name="uq_user_sessions_current_jti"),
    )