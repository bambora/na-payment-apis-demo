import os

FEATURE_FLAGS = {
    'apple_pay' : True if os.getenv("APPLE_PAY") == 'True' else False,
}