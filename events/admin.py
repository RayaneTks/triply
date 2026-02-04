from django.contrib import admin
from .models import Event, InvitationTemplate, Guest, InvitationInstance, CheckInLog


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ("title", "start_at", "status", "organizer")
    list_filter = ("status",)
    search_fields = ("title", "description")


@admin.register(InvitationTemplate)
class InvitationTemplateAdmin(admin.ModelAdmin):
    list_display = ("name", "is_system", "owner")
    list_filter = ("is_system",)
    search_fields = ("name", "tags")


@admin.register(Guest)
class GuestAdmin(admin.ModelAdmin):
    list_display = ("first_name", "last_name", "email", "event", "status")
    list_filter = ("status", "event")
    search_fields = ("first_name", "last_name", "email")


@admin.register(InvitationInstance)
class InvitationInstanceAdmin(admin.ModelAdmin):
    list_display = ("guest", "template", "created_at")


@admin.register(CheckInLog)
class CheckInLogAdmin(admin.ModelAdmin):
    list_display = ("guest", "scanned_at", "result", "scanned_by")
