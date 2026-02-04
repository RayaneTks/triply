from django.conf import settings
from django.core import signing
from django.db import models
from django.utils import timezone


class Event(models.Model):
    STATUS_DRAFT = "draft"
    STATUS_PUBLISHED = "published"
    STATUS_CHOICES = [
        (STATUS_DRAFT, "Brouillon"),
        (STATUS_PUBLISHED, "Publié"),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    start_at = models.DateTimeField()
    address = models.CharField(max_length=255)
    organizer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_DRAFT)
    image = models.ImageField(upload_to="events/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class InvitationTemplate(models.Model):
    name = models.CharField(max_length=200)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, blank=True, null=True
    )
    is_system = models.BooleanField(default=False)
    tags = models.CharField(max_length=200, blank=True)
    width = models.PositiveIntegerField(default=800)
    height = models.PositiveIntegerField(default=600)
    fabric_json = models.JSONField(default=dict)
    thumbnail = models.ImageField(upload_to="templates/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Guest(models.Model):
    STATUS_INVITED = "invited"
    STATUS_CONFIRMED = "confirmed"
    STATUS_DECLINED = "declined"
    STATUS_CHECKED_IN = "checked_in"
    STATUS_CHOICES = [
        (STATUS_INVITED, "Invité"),
        (STATUS_CONFIRMED, "Confirmé"),
        (STATUS_DECLINED, "Décliné"),
        (STATUS_CHECKED_IN, "Check-in"),
    ]

    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="guests")
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=30, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_INVITED)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("event", "email")

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class InvitationInstance(models.Model):
    guest = models.OneToOneField(Guest, on_delete=models.CASCADE, related_name="invitation")
    template = models.ForeignKey(InvitationTemplate, on_delete=models.SET_NULL, null=True)
    token = models.CharField(max_length=255, unique=True)
    image = models.ImageField(upload_to="invitations/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Invitation {self.guest}"

    @staticmethod
    def sign_token(event_id, guest_id):
        return signing.dumps({"event_id": event_id, "guest_id": guest_id}, salt="invite")

    @staticmethod
    def verify_token(token, max_age=None):
        return signing.loads(token, salt="invite", max_age=max_age)


class CheckInLog(models.Model):
    guest = models.ForeignKey(Guest, on_delete=models.SET_NULL, null=True, blank=True)
    scanned_at = models.DateTimeField(default=timezone.now)
    scanned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, blank=True, null=True
    )
    result = models.CharField(max_length=50)
    raw_token = models.CharField(max_length=255)

    def __str__(self):
        return f"{self.guest} - {self.result}"
