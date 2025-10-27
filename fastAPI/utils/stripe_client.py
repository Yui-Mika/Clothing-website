import stripe
from app.core.config import settings


def get_stripe() -> stripe.StripeClient:
    return stripe.StripeClient(api_key=settings.stripe_secret_key)


