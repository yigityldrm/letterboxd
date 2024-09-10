from rest_framework import permissions
from rest_framework.permissions import IsAuthenticated


class IsSuperuser(permissions.BasePermission):
    """
    Custom permission to only allow superusers to access the view.
    """

    def has_permission(self, request, view):
        # Check if the user is authenticated and is a superuser
        return request.user and request.user.is_authenticated and request.user.is_superuser


class IsSuperUserOrReadOnly(IsAuthenticated):
    """Custom permission to allow only superusers to update or delete."""

    def has_permission(self, request, view):
        if request.method in ['PUT', 'PATCH', 'DELETE']:
            return request.user.is_superuser
        return super().has_permission(request, view)


class IsOwnerOrIsSuperUser(permissions.BasePermission):
    """
    Custom permission to only allow the owner of an object or a superuser (admin) to modify it.
    """

    def has_object_permission(self, request, view, obj):
        # Allow access if the user is a superuser
        if request.user.is_superuser:
            return True

        # Allow access if the user is the owner of the object
        if obj.user == request.user:
            return True

        # If neither condition is met, deny permission
        return False
