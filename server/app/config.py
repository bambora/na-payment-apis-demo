import os

FEATURE_FLAGS = {
    'apple_pay' : True if os.getenv("APP_ENV") == 'dev-cde' else False,
}