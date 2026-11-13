from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # /admin/ en local ; déplacée en production (DJANGO_ADMIN_PATH), car /admin
    # est le tableau de bord React de l'équipe sur le même domaine
    path(settings.DJANGO_ADMIN_PATH, admin.site.urls),
    path('api/', include('marketplace.urls')),
]

# Permet de lire les images médias depuis le navigateur en développement
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)