"""Conversation Service — handles all conversation and message operations.

This service enforces:
- Business isolation (conversations are scoped to a business)
- Ownership verification (user must own the business)
- Proper conversation creation and message persistence
- Conversation titles derived from first user message
- Message ordering and timestamps

Security:
- Always verify business ownership before any operation
- Never trust conversation_id from client without verification
- Messages are always associated with a valid conversation
"""

import json
from datetime import datetime
from sqlalchemy.orm import Session

from models import ChatConversation, ChatMessageRow, Business, User


# ---------------------------------------------------------------------------
# Conversation CRUD
# ---------------------------------------------------------------------------

def list_conversations(
    db: Session, business_id: str, limit: int | None = None, offset: int = 0
) -> list[dict]:
    """List conversations for a business, newest first.

    limit/offset provide optional pagination. The frontend currently loads
    the full list; limit is available for callers that need a bounded window.
    """
    query = (
        db.query(ChatConversation)
        .filter(ChatConversation.business_id == business_id)
        .order_by(ChatConversation.updated_at.desc(), ChatConversation.created_at.desc())
    )
    if offset:
        query = query.offset(offset)
    if limit is not None:
        query = query.limit(limit)

    conversations = query.all()
    return [
        {
            "id": c.id,
            "title": c.title or "New conversation",
            "updated_at": c.updated_at,
        }
        for c in conversations
    ]


def create_conversation(db: Session, business_id: str, title: str | None = None) -> dict:
    """Create a new empty conversation."""
    conversation = ChatConversation(
        business_id=business_id,
        title=title or None,
    )
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return {
        "id": conversation.id,
        "title": conversation.title or "New conversation",
        "updated_at": conversation.updated_at,
    }


def get_conversation(db: Session, conversation_id: str) -> ChatConversation | None:
    """Get a conversation by ID. Returns None if not found."""
    return db.query(ChatConversation).filter(ChatConversation.id == conversation_id).first()


def verify_conversation_ownership(db: Session, conversation_id: str, business_id: str) -> ChatConversation:
    """Verify a conversation belongs to the specified business.

    Raises ValueError if conversation not found or doesn't belong to the business.
    """
    conversation = get_conversation(db, conversation_id)
    if not conversation:
        raise ValueError("Conversation not found")
    if conversation.business_id != business_id:
        raise ValueError("Conversation does not belong to this business")
    return conversation


def delete_conversation(db: Session, conversation_id: str, business_id: str) -> bool:
    """Delete a conversation and all its messages.

    Returns True if deleted, False if not found.
    """
    conversation = verify_conversation_ownership(db, conversation_id, business_id)
    db.delete(conversation)
    db.commit()
    return True


def update_conversation_title(db: Session, conversation_id: str, title: str) -> None:
    """Update a conversation's title."""
    conversation = get_conversation(db, conversation_id)
    if conversation:
        conversation.title = title[:255] if title else None
        db.commit()


# ---------------------------------------------------------------------------
# Message operations
# ---------------------------------------------------------------------------

def add_message(
    db: Session,
    conversation_id: str,
    role: str,
    msg_type: str,
    content: str,
    action: dict | None = None,
) -> ChatMessageRow:
    """Add a message to a conversation and update the conversation's timestamp.

    Returns the newly created row so callers can reference its id.
    """
    message = ChatMessageRow(
        conversation_id=conversation_id,
        role=role,
        msg_type=msg_type,
        content=content,
        action_json=json.dumps(action) if action is not None else None,
    )
    db.add(message)
    db.flush()

    # Update conversation timestamp
    conversation = get_conversation(db, conversation_id)
    if conversation:
        conversation.updated_at = datetime.utcnow()

    db.commit()
    return message


def _serialize_message(msg: ChatMessageRow) -> dict:
    action = json.loads(msg.action_json) if msg.action_json else None
    return {
        "id": msg.id,
        "role": msg.role,
        "msg_type": msg.msg_type,
        "content": msg.content,
        "action": action,
        "created_at": msg.created_at,
    }


def get_conversation_messages(
    db: Session,
    conversation_id: str,
    limit: int = 500,
    before_id: str | None = None,
) -> list[dict]:
    """Get messages in a conversation, oldest first.

    PRODUCTION HARDENING: the previous implementation hydrated the full
    lazy `conversation.messages` collection — a long conversation loads every
    row (including large tool payloads) into memory and over the wire. This
    fetches the latest `limit` rows with an explicit bounded query. Callers that
    want full history keep compatibility via a high default; pagination is
    available with `before_id` for windowed loading.
    """
    query = (
        db.query(ChatMessageRow)
        .filter(ChatMessageRow.conversation_id == conversation_id)
        .order_by(ChatMessageRow.created_at.desc())
    )
    if before_id:
        # Rows strictly before the given message (windowed pagination).
        pivot = db.query(ChatMessageRow.created_at).filter(
            ChatMessageRow.id == before_id
        ).scalar()
        if pivot is not None:
            query = query.filter(ChatMessageRow.created_at < pivot)

    rows = query.limit(max(1, limit)).all()
    # Reverse to oldest-first for the existing contract.
    return [_serialize_message(msg) for msg in reversed(rows)]


def get_recent_messages(
    db: Session, conversation_id: str, limit: int = 12
) -> list[dict]:
    """Get the most recent `limit` messages in a conversation, oldest first.

    Used to build the AI's multi-turn context. Only user/assistant text
    turns are included so tool results and actions never leak into the
    prompt.

    PERFORMANCE: Uses LIMIT at database level to prevent loading entire
    conversation history. Critical for long conversations under production load.
    """
    rows = (
        db.query(ChatMessageRow)
        .filter(
            ChatMessageRow.conversation_id == conversation_id,
            ChatMessageRow.role.in_(["user", "assistant"]),
            ChatMessageRow.msg_type.in_(["text", "answer", "error"]),
        )
        .order_by(ChatMessageRow.created_at.desc())
        .limit(limit)
        .all()
    )
    # Reverse to get oldest-first order
    return [_serialize_message(msg) for msg in reversed(rows)]


def get_message_count(db: Session, conversation_id: str) -> int:
    """Count messages in a conversation."""
    return db.query(ChatMessageRow).filter(
        ChatMessageRow.conversation_id == conversation_id
    ).count()


# ---------------------------------------------------------------------------
# Conversation title generation
# ---------------------------------------------------------------------------

def derive_title_from_message(message: str | None, max_length: int = 60) -> str:
    """Generate a conversation title from the first user message."""
    if not message:
        return "New conversation"
    title = message.strip()
    if not title:
        return "New conversation"
    if len(title) > max_length:
        title = title[:max_length].rsplit(" ", 1)[0] + "..."
    return title


def auto_title_conversation(db: Session, conversation_id: str) -> None:
    """Auto-generate title from the first user message if not already set."""
    conversation = get_conversation(db, conversation_id)
    if not conversation or conversation.title:
        return

    # Get the first user message
    first_user_msg = (
        db.query(ChatMessageRow)
        .filter(
            ChatMessageRow.conversation_id == conversation_id,
            ChatMessageRow.role == "user",
        )
        .order_by(ChatMessageRow.created_at)
        .first()
    )

    if first_user_msg:
        conversation.title = derive_title_from_message(first_user_msg.content)
        db.commit()


# ---------------------------------------------------------------------------
# Lazy conversation creation (for /api/chat)
# ---------------------------------------------------------------------------

def get_or_create_conversation(
    db: Session,
    business_id: str,
    conversation_id: str | None,
    first_message: str | None = None,
) -> ChatConversation:
    """Get an existing conversation or create a new one.

    If conversation_id is provided, verify it belongs to the business.
    If not provided or invalid, create a new conversation.

    For lazy creation during chat: pass first_message to auto-title.
    """
    if conversation_id:
        try:
            conversation = verify_conversation_ownership(db, conversation_id, business_id)
            # Auto-title a fresh conversation from its first user message —
            # New Chat conversations start untitled and gain a title once the
            # user sends their first message.
            if first_message and not conversation.title:
                conversation.title = derive_title_from_message(first_message)
                db.flush()
            return conversation
        except ValueError:
            pass

    # Create new conversation
    title = derive_title_from_message(first_message) if first_message else None
    new_conv = ChatConversation(
        business_id=business_id,
        title=title,
    )
    db.add(new_conv)
    db.flush()
    return new_conv


# ---------------------------------------------------------------------------
# Business isolation helpers
# ---------------------------------------------------------------------------

def get_user_businesses(db: Session, user: User) -> list[Business]:
    """Get all businesses owned by a user."""
    return (
        db.query(Business)
        .filter(Business.owner_id == user.id)
        .order_by(Business.created_at)
        .all()
    )


def verify_user_owns_business(db: Session, user: User, business_id: str) -> Business:
    """Verify the user owns the specified business.

    Raises ValueError if business not found or not owned by user.
    """
    business = db.query(Business).filter(Business.id == business_id).first()
    if not business:
        raise ValueError("Business not found")
    if business.owner_id != user.id:
        raise ValueError("Business not found")
    return business