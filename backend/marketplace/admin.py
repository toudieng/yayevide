from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Boutique, Produit, Commande, AvisVendeur, Categorie, ImageProduit, FilSupport, MessageSupport

class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ('Informations Spécifiques Yaay Vidé', {'fields': ('role', 'phone_number', 'is_whatsapp_verified', 'whatsapp_verification_token')}),
    )
    list_display = ['username', 'email', 'phone_number', 'role', 'is_whatsapp_verified']
    list_filter = ['role', 'is_whatsapp_verified']


class ImageProduitInline(admin.TabularInline):
    model = ImageProduit
    extra = 1


class ProduitAdmin(admin.ModelAdmin):
    list_display = ['titre', 'boutique', 'categorie', 'type_offre', 'prix_vendeur', 'disponible']
    list_filter = ['categorie', 'type_offre', 'disponible']
    inlines = [ImageProduitInline]


class CategorieAdmin(admin.ModelAdmin):
    list_display = ['nom', 'slug', 'ordre']
    prepopulated_fields = {'slug': ('nom',)}


admin.site.register(User, CustomUserAdmin)
admin.site.register(Boutique)
admin.site.register(Produit, ProduitAdmin)
admin.site.register(Commande)
admin.site.register(AvisVendeur)
admin.site.register(Categorie, CategorieAdmin)

class MessageSupportInline(admin.TabularInline):
    model = MessageSupport
    extra = 0
    fields = ['de_l_equipe', 'auteur', 'texte', 'produit', 'commande', 'envoye_le', 'lu_le']
    readonly_fields = ['envoye_le']


@admin.register(FilSupport)
class FilSupportAdmin(admin.ModelAdmin):
    list_display = ['utilisateur', 'en_attente_equipe', 'dernier_message_le']
    list_filter = ['en_attente_equipe']
    search_fields = ['utilisateur__username', 'utilisateur__email', 'utilisateur__phone_number']
    inlines = [MessageSupportInline]
