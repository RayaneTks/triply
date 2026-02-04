# Generated manually
from django.conf import settings
from django.db import migrations, models
import django.utils.timezone
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Event",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=200)),
                ("description", models.TextField(blank=True)),
                ("start_at", models.DateTimeField()),
                ("address", models.CharField(max_length=255)),
                (
                    "status",
                    models.CharField(
                        choices=[("draft", "Brouillon"), ("published", "Publié")],
                        default="draft",
                        max_length=20,
                    ),
                ),
                ("image", models.ImageField(blank=True, null=True, upload_to="events/")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "organizer",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL),
                ),
            ],
        ),
        migrations.CreateModel(
            name="InvitationTemplate",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=200)),
                ("is_system", models.BooleanField(default=False)),
                ("tags", models.CharField(blank=True, max_length=200)),
                ("width", models.PositiveIntegerField(default=800)),
                ("height", models.PositiveIntegerField(default=600)),
                ("fabric_json", models.JSONField(default=dict)),
                ("thumbnail", models.ImageField(blank=True, null=True, upload_to="templates/")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "owner",
                    models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL),
                ),
            ],
        ),
        migrations.CreateModel(
            name="Guest",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("first_name", models.CharField(max_length=100)),
                ("last_name", models.CharField(max_length=100)),
                ("email", models.EmailField(max_length=254)),
                ("phone", models.CharField(blank=True, max_length=30)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("invited", "Invité"),
                            ("confirmed", "Confirmé"),
                            ("declined", "Décliné"),
                            ("checked_in", "Check-in"),
                        ],
                        default="invited",
                        max_length=20,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "event",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="guests", to="events.event"),
                ),
            ],
            options={
                "unique_together": {("event", "email")},
            },
        ),
        migrations.CreateModel(
            name="InvitationInstance",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("token", models.CharField(max_length=255, unique=True)),
                ("image", models.ImageField(blank=True, null=True, upload_to="invitations/")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "guest",
                    models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="invitation", to="events.guest"),
                ),
                (
                    "template",
                    models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to="events.invitationtemplate"),
                ),
            ],
        ),
        migrations.CreateModel(
            name="CheckInLog",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("scanned_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("result", models.CharField(max_length=50)),
                ("raw_token", models.CharField(max_length=255)),
                (
                    "guest",
                    models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to="events.guest"),
                ),
                (
                    "scanned_by",
                    models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL),
                ),
            ],
        ),
    ]
