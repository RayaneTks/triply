from django.urls import path
from . import views

urlpatterns = [
    path("events/", views.event_list, name="event_list"),
    path("events/new/", views.event_create, name="event_create"),
    path("events/<int:event_id>/", views.event_detail, name="event_detail"),
    path("events/<int:event_id>/edit/", views.event_edit, name="event_edit"),
    path("events/<int:event_id>/guests/", views.guest_list, name="guest_list"),
    path("events/<int:event_id>/guests/new/", views.guest_create, name="guest_create"),
    path("events/<int:event_id>/guests/<int:guest_id>/edit/", views.guest_edit, name="guest_edit"),
    path("templates/", views.template_list, name="template_list"),
    path("templates/new/", views.template_create, name="template_create"),
    path("templates/<int:template_id>/edit/", views.template_editor, name="template_editor"),
    path("invite/<str:token>/", views.invite_view, name="invite_view"),
    path("scanner/<int:event_id>/", views.scanner_view, name="scanner_view"),
    path("api/templates/<int:template_id>/save_json/", views.api_save_template_json, name="api_save_template_json"),
    path("api/templates/<int:template_id>/load_json/", views.api_load_template_json, name="api_load_template_json"),
    path("api/templates/<int:template_id>/duplicate/", views.api_duplicate_template, name="api_duplicate_template"),
    path("api/templates/<int:template_id>/render_thumbnail/", views.api_render_thumbnail, name="api_render_thumbnail"),
    path("api/invitations/generate_for_guest/", views.api_generate_invitation_for_guest, name="api_generate_invitation_for_guest"),
    path("api/checkin/", views.api_checkin, name="api_checkin"),
    path("api/guest/confirm/", views.api_guest_confirm, name="api_guest_confirm"),
]
