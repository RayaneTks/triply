from django import forms
from .models import Event, Guest, InvitationTemplate


class EventForm(forms.ModelForm):
    class Meta:
        model = Event
        fields = ["title", "description", "start_at", "address", "status", "image"]
        widgets = {
            "start_at": forms.DateTimeInput(attrs={"type": "datetime-local"}),
        }


class GuestForm(forms.ModelForm):
    class Meta:
        model = Guest
        fields = ["first_name", "last_name", "email", "phone", "status"]


class InvitationTemplateForm(forms.ModelForm):
    class Meta:
        model = InvitationTemplate
        fields = ["name", "tags", "width", "height"]
