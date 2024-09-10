from rest_framework_simplejwt.authentication import JWTAuthentication

from rest_framework_simplejwt.exceptions import InvalidToken, TokenError, AuthenticationFailed


class LocalStorageJWTAuthentication(JWTAuthentication):
    def get_raw_token(self, request):
        # Get the access token from the Authorization header
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            print(f"Access token from Authorization header: {token}")
            return token
        print("No access token found in Authorization header")
        return None

    def authenticate(self, request):
        raw_token = self.get_raw_token(request)
        if raw_token is None:
            return None

        try:
            # Validate the token
            validated_token = self.get_validated_token(raw_token)
            return self.get_user(validated_token), validated_token
        except AuthenticationFailed as e:
            print(f"Authentication failed: {e}")
        except InvalidToken as e:
            print(f"Invalid token: {e}")
        except TokenError as e:
            print(f"Token error: {e}")

        return None
