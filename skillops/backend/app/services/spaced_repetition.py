"""Spaced repetition scheduling logic (3-interval: Day 1, Day 3, Day 7)."""
from datetime import datetime, timedelta
from typing import List, Tuple


def compute_review_dates(created_at: datetime) -> Tuple[str, str, str]:
    """Return ISO date strings for the 3 spaced repetition review intervals."""
    d1 = (created_at + timedelta(days=1)).strftime("%Y-%m-%d")
    d2 = (created_at + timedelta(days=3)).strftime("%Y-%m-%d")
    d3 = (created_at + timedelta(days=7)).strftime("%Y-%m-%d")
    return d1, d2, d3


def get_due_today(mistakes) -> List:
    """Filter mistakes that have at least one review due today."""
    today = datetime.utcnow().strftime("%Y-%m-%d")
    due = []
    for m in mistakes:
        is_due = (
            (not m.reviewed_1 and m.interval_1_date == today) or
            (not m.reviewed_2 and m.interval_2_date == today) or
            (not m.reviewed_3 and m.interval_3_date == today)
        )
        if is_due:
            due.append(m)
    return due


def get_upcoming_reviews(mistakes, days_ahead: int = 7) -> List[dict]:
    """Return upcoming review schedule for the next N days."""
    today = datetime.utcnow().date()
    schedule = []
    for m in mistakes:
        for interval, reviewed, date_str in [
            (1, m.reviewed_1, m.interval_1_date),
            (2, m.reviewed_2, m.interval_2_date),
            (3, m.reviewed_3, m.interval_3_date),
        ]:
            if reviewed or not date_str:
                continue
            try:
                review_date = datetime.strptime(date_str, "%Y-%m-%d").date()
                delta = (review_date - today).days
                if 0 <= delta <= days_ahead:
                    schedule.append({
                        "mistake_id": m.id,
                        "content": m.content[:80] + ("…" if len(m.content) > 80 else ""),
                        "review_date": date_str,
                        "interval": interval,
                        "days_until": delta,
                    })
            except ValueError:
                continue
    return sorted(schedule, key=lambda x: x["days_until"])


def compute_completion_pct(mistake) -> int:
    """Return how many of the 3 intervals have been reviewed (0-100)."""
    done = sum([mistake.reviewed_1, mistake.reviewed_2, mistake.reviewed_3])
    return int((done / 3) * 100)
