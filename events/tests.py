from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from .models import Event, Guest, InvitationInstance
from django.utils import timezone


class InvitationFlowTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username="test", password="pass")
        self.event = Event.objects.create(
            title="Demo",
            description="Demo event",
            start_at=timezone.now(),
            address="Paris",
            organizer=self.user,
        )
        self.guest = Guest.objects.create(
            event=self.event,
            first_name="Ada",
            last_name="Lovelace",
            email="ada@example.com",
        )
        token = InvitationInstance.sign_token(self.event.id, self.guest.id)
        self.invite = InvitationInstance.objects.create(guest=self.guest, template=None, token=token)

    def test_token_sign_verify(self):
        data = InvitationInstance.verify_token(self.invite.token)
        self.assertEqual(data["event_id"], self.event.id)
        self.assertEqual(data["guest_id"], self.guest.id)

    def test_confirmation_flow(self):
        url = reverse("api_guest_confirm")
        resp = self.client.post(
            url,
            data={"token": self.invite.token, "status": "confirmed"},
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 200)
        self.guest.refresh_from_db()
        self.assertEqual(self.guest.status, Guest.STATUS_CONFIRMED)

    def test_checkin_flow(self):
        self.client.login(username="test", password="pass")
        url = reverse("api_checkin")
        resp = self.client.post(
            url,
            data={"token": self.invite.token},
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 200)
        self.guest.refresh_from_db()
        self.assertEqual(self.guest.status, Guest.STATUS_CHECKED_IN)
