from rest_framework.permissions import BasePermission


class EstAdmin(BasePermission):
    """Réservé aux comptes role='admin' (super-utilisateurs Django inclus,
    pratique pour l'équipe technique qui n'a pas forcément un compte
    explicitement marqué 'admin')."""

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and (user.role == 'admin' or user.is_superuser))


class EstLivreur(BasePermission):
    """Réservé aux comptes role='livreur'."""

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.role == 'livreur')
