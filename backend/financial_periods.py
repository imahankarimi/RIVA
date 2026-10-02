"""Deterministic date/period resolution for RIVA AI financial queries.

The AI never invents date ranges. Every "last month", "last 30 days",
"this year" etc. is translated here — server-side — into an exact
[start, end) boundary. The reference point is the server's own calendar
day ("today"), and all boundaries are calendar-based and deterministic.

The accounting engine stores all timestamps in UTC (datetime.utcnow),
so periods are computed in UTC too. Because every RIVA business shares
the same server clock, a "month" always means the same thing to the
engine and to the AI — there is no invented fiscal period.
"""

from dataclasses import dataclass
from datetime import date, datetime, timedelta

# ---------------------------------------------------------------------------
# Period model
# ---------------------------------------------------------------------------

@dataclass
class Period:
    """A half-open [start, end) time range plus a human-readable label.

    start/end are naive UTC datetimes (the accounting engine's convention).
    end=None means "open ended" (e.g. balance questions: everything posted
    to date).
    """

    label: str
    start: datetime | None = None
    end: datetime | None = None
    ambiguous: bool = False

    def to_dict(self) -> dict:
        return {
            "label": self.label,
            "start": self.start.isoformat() if self.start else None,
            "end": self.end.isoformat() if self.end else None,
            "ambiguous": self.ambiguous,
        }


# ---------------------------------------------------------------------------
# Calendar helpers (all deterministic)
# ---------------------------------------------------------------------------

def _today() -> date:
    """Server-local calendar day — the reference for all relative periods."""
    return datetime.now().date()


def _start_of_day(d: date) -> datetime:
    return datetime(d.year, d.month, d.day)


def _add_months(d: date, months: int) -> date:
    month_index = d.month - 1 + months
    year = d.year + month_index // 12
    month = month_index % 12 + 1
    day = min(d.day, _days_in_month(year, month))
    return date(year, month, day)


def _days_in_month(year: int, month: int) -> int:
    if month == 12:
        return 31
    next_month = date(year if month < 12 else year + 1, 1 if month == 12 else month + 1, 1)
    return (next_month - timedelta(days=1)).day


def month_bounds(d: date) -> tuple[datetime, datetime]:
    first = date(d.year, d.month, 1)
    nxt = _add_months(first, 1)
    return _start_of_day(first), _start_of_day(nxt)


def week_bounds(d: date, week_starts_monday: bool = True) -> tuple[datetime, datetime]:
    if week_starts_monday:
        start = d - timedelta(days=d.weekday())
    else:
        start = d - timedelta(days=(d.weekday() + 1) % 7)
    return _start_of_day(start), _start_of_day(start + timedelta(days=7))


def quarter_bounds(d: date) -> tuple[datetime, datetime]:
    q_start_month = ((d.month - 1) // 3) * 3 + 1
    first = date(d.year, q_start_month, 1)
    nxt = _add_months(first, 3)
    return _start_of_day(first), _start_of_day(nxt)


def year_bounds(d: date) -> tuple[datetime, datetime]:
    return _start_of_day(date(d.year, 1, 1)), _start_of_day(date(d.year + 1, 1, 1))


def n_days_bounds(d: date, days: int) -> tuple[datetime, datetime]:
    return _start_of_day(d - timedelta(days=days - 1)), _start_of_day(d + timedelta(days=1))


# ---------------------------------------------------------------------------
# Phrase detection
# ---------------------------------------------------------------------------

# (phrase, handler) — handler receives the reference date and returns a Period.
_RELATIVE = [
    (("today", "امروز"), lambda d: Period(
        "today", *_day_bounds(d))),
    (("yesterday", "دیروز", "دیشب"), lambda d: Period(
        "yesterday", *_day_bounds(_add_days(d, -1)))),
    (("this month", "این ماه", "ماه جاری", "ماه جاری", "اینماه"), lambda d: Period(
        "this month", *month_bounds(d))),
    (("last month", "ماه قبل", "ماه گذشته", "ماه پیش", "ماه قبلی"), lambda d: Period(
        "last month", *month_bounds(_add_months(d, -1)))),
    (("this week", "این هفته", "هفته جاری"), lambda d: Period(
        "this week", *week_bounds(d))),
    (("last week", "هفته قبل", "هفته گذشته", "هفته پیش"), lambda d: Period(
        "last week", *week_bounds(_add_days(d, -7)))),
    (("this quarter", "این سهماهه", "این سه ماه", "این فصل"), lambda d: Period(
        "this quarter", *quarter_bounds(d))),
    (("last quarter", "سهماهه قبل", "سه ماه قبل", "فصل قبل"), lambda d: Period(
        "last quarter", *quarter_bounds(_add_months(d, -3)))),
    (("this year", "امسال", "سال جاری"), lambda d: Period(
        "this year", *year_bounds(d))),
    (("last year", "پارسال", "سال قبل", "سال گذشته"), lambda d: Period(
        "last year", *year_bounds(date(d.year - 1, d.month, d.day)))),
]


def _day_bounds(d: date) -> tuple[datetime, datetime]:
    return _start_of_day(d), _start_of_day(d + timedelta(days=1))


def _add_days(d: date, days: int) -> date:
    return d + timedelta(days=days)


def _last_n_days(d: date, n: int) -> Period:
    return Period(f"last {n} days", *n_days_bounds(d, n))


def _n_months_back(d: date, n: int) -> Period:
    target = _add_months(d, -n)
    start, _ = month_bounds(target)
    now = datetime(d.year, d.month, d.day)
    return Period(f"{n} month(s) ago", start, now)


_NUMBER_WORDS = {
    "یک": 1, "دو": 2, "سه": 3, "چهار": 4, "پنج": 5, "شش": 6,
    "هفت": 7, "هشت": 8, "نه": 9, "ده": 10, "بیست": 20, "سی": 30,
    "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
    "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
}

_PERSIAN_DIGIT_MAP = str.maketrans("۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩", "01234567890123456789")


def _extract_number(message: str) -> int | None:
    """Pull the first integer from a message (Persian/Latin digits or words)."""
    normalized = message.translate(_PERSIAN_DIGIT_MAP)
    m = None
    import re
    m = re.search(r"(\d+)", normalized)
    if m:
        return int(m.group(1))
    for word, value in _NUMBER_WORDS.items():
        if word in message:
            return value
    return None


# Gregorian month names — matched as "in <month>" type phrases.
_GREGORIAN_MONTHS = [
    ("january", "jan", 1), ("february", "feb", 2), ("march", "mar", 3),
    ("april", "apr", 4), ("may", "may", 5), ("june", "jun", 6),
    ("july", "jul", 7), ("august", "aug", 8), ("september", "sep", 9),
    ("october", "oct", 10), ("november", "nov", 11), ("december", "dec", 12),
]


def parse_period(message: str, today: date | None = None) -> Period | None:
    """Resolve a period phrase inside a question to an exact time range.

    Returns None when no period could be resolved — callers then choose a
    sensible default (and should say so in the answer).
    """
    today = today or _today()
    normalized = " ".join(message.split()).casefold()

    # Relative periods
    for phrases, handler in _RELATIVE:
        if any(phrase in normalized for phrase in phrases):
            return handler(today)

    # "last N days" / "past N days" / "N days ago" (both languages)
    import re
    m = re.search(r"(?:last|past|previous|اخیر|گذشته|گدشته)?\s*(\d+)\s*(?:days|روز|روزه)\s*(?:ago|قبل|پیش|گذشته)?", normalized)
    if m:
        n = int(m.group(1))
        return _last_n_days(today, max(1, min(n, 366)))

    # "last N months" / "N months ago"
    m = re.search(r"(?:last|previous|)\s*(\d+)\s*months?\s*(?:ago|قبل|پیش)?", normalized)
    if m:
        return _n_months_back(today, max(1, min(int(m.group(1)), 24)))

    # Named Gregorian month ("in March", "March 2024", "ماه مارس")
    for name, _short, month_num in _GREGORIAN_MONTHS:
        if name in normalized or _short in normalized:
            year = today.year
            # If the named month is later than this month, most likely last year
            if month_num > today.month:
                year -= 1
            start = _start_of_day(date(year, month_num, 1))
            end = _start_of_day(date(year + (1 if month_num == 12 else 0), (1 if month_num == 12 else month_num + 1), 1))
            return Period(f"{name.title()} {year}", start, end)

    # Quarters: "Q1", "Q2 2024", "quarter 1"
    m = re.search(r"q([1-4])(?:\s*(\d{4}))?|quarter\s*([1-4])", normalized)
    if m:
        q = int(m.group(1) or m.group(3))
        year = int(m.group(2)) if m.group(2) else today.year
        if q * 3 > today.month:  # future quarter this year → last year
            year -= 1
        start_month = (q - 1) * 3 + 1
        start = _start_of_day(date(year, start_month, 1))
        end = _start_of_day(date(year + (1 if start_month + 3 > 12 else 0), ((start_month + 3 - 1) % 12) + 1, 1))
        return Period(f"Q{q} {year}", start, end)

    # Persian month names — not resolvable to an exact Gregorian range without
    # the solar-Hijri calendar; flag as ambiguous rather than guess.
    persian_months = (
        "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
        "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
    )
    if any(month in message for month in persian_months):
        return Period(
            label="a specific Persian-calendar month",
            ambiguous=True,
        )

    return None


def default_period() -> Period:
    """Sensible fallback when no explicit period is found: the last 30 days."""
    return _last_n_days(_today(), 30)