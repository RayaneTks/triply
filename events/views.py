import base64
import io
import json
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.core.files.base import ContentFile
from django.http import JsonResponse, HttpResponseBadRequest, HttpResponseForbidden
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone
from django.views.decorators.http import require_http_methods
import qrcode
from django.db.models import Q
from .forms import EventForm, GuestForm, InvitationTemplateForm
from .models import Event, Guest, InvitationTemplate, InvitationInstance, CheckInLog


@login_required
def dashboard(request):
    events = Event.objects.filter(organizer=request.user).order_by("-start_at")[:5]
    return render(request, "dashboard.html", {"events": events})


@login_required
def event_list(request):
    events = Event.objects.filter(organizer=request.user).order_by("-start_at")
    return render(request, "events/event_list.html", {"events": events})


@login_required
def event_detail(request, event_id):
    event = get_object_or_404(Event, pk=event_id, organizer=request.user)
    return render(request, "events/event_detail.html", {"event": event})


@login_required
def event_create(request):
    if request.method == "POST":
        form = EventForm(request.POST, request.FILES)
        if form.is_valid():
            event = form.save(commit=False)
            event.organizer = request.user
            event.save()
            messages.success(request, "Événement créé.")
            return redirect("event_detail", event_id=event.id)
    else:
        form = EventForm()
    return render(request, "events/event_form.html", {"form": form, "title": "Créer un événement"})


@login_required
def event_edit(request, event_id):
    event = get_object_or_404(Event, pk=event_id, organizer=request.user)
    if request.method == "POST":
        form = EventForm(request.POST, request.FILES, instance=event)
        if form.is_valid():
            form.save()
            messages.success(request, "Événement mis à jour.")
            return redirect("event_detail", event_id=event.id)
    else:
        form = EventForm(instance=event)
    return render(request, "events/event_form.html", {"form": form, "title": "Modifier l'événement"})


@login_required
def guest_list(request, event_id):
    event = get_object_or_404(Event, pk=event_id, organizer=request.user)
    guests = event.guests.order_by("last_name", "first_name")
    return render(
        request,
        "guests/guest_list.html",
        {"event": event, "guests": guests},
    )


@login_required
def guest_create(request, event_id):
    event = get_object_or_404(Event, pk=event_id, organizer=request.user)
    if request.method == "POST":
        form = GuestForm(request.POST)
        if form.is_valid():
            guest = form.save(commit=False)
            guest.event = event
            guest.save()
            messages.success(request, "Invité ajouté.")
            return redirect("guest_list", event_id=event.id)
    else:
        form = GuestForm()
    return render(
        request,
        "guests/guest_form.html",
        {"form": form, "event": event, "title": "Ajouter un invité"},
    )


@login_required
def guest_edit(request, event_id, guest_id):
    event = get_object_or_404(Event, pk=event_id, organizer=request.user)
    guest = get_object_or_404(Guest, pk=guest_id, event=event)
    if request.method == "POST":
        form = GuestForm(request.POST, instance=guest)
        if form.is_valid():
            form.save()
            messages.success(request, "Invité mis à jour.")
            return redirect("guest_list", event_id=event.id)
    else:
        form = GuestForm(instance=guest)
    return render(
        request,
        "guests/guest_form.html",
        {"form": form, "event": event, "title": "Modifier un invité"},
    )


@login_required
def template_list(request):
    templates = InvitationTemplate.objects.filter(Q(owner=request.user) | Q(is_system=True))
    return render(request, "templates/template_list.html", {"templates": templates})


@login_required
def template_create(request):
    if request.method == "POST":
        form = InvitationTemplateForm(request.POST)
        if form.is_valid():
            template = form.save(commit=False)
            template.owner = request.user
            template.fabric_json = {"version": "5.3.0", "objects": [], "background": "#ffffff"}
            template.save()
            messages.success(request, "Template créé.")
            return redirect("template_editor", template_id=template.id)
    else:
        form = InvitationTemplateForm()
    return render(request, "templates/template_form.html", {"form": form})


@login_required
def template_editor(request, template_id):
    template = get_object_or_404(InvitationTemplate, pk=template_id)
    if template.owner and template.owner != request.user:
        return HttpResponseForbidden()
    return render(request, "templates/template_editor.html", {"template": template})


@require_http_methods(["POST"])
@login_required
def api_save_template_json(request, template_id):
    template = get_object_or_404(InvitationTemplate, pk=template_id)
    if template.owner and template.owner != request.user:
        return HttpResponseForbidden()
    payload = json.loads(request.body.decode("utf-8"))
    template.fabric_json = payload
    template.save(update_fields=["fabric_json"])
    return JsonResponse({"status": "ok"})


@require_http_methods(["GET"])
@login_required
def api_load_template_json(request, template_id):
    template = get_object_or_404(InvitationTemplate, pk=template_id)
    if template.owner and template.owner != request.user and not template.is_system:
        return HttpResponseForbidden()
    return JsonResponse({"fabric_json": template.fabric_json, "width": template.width, "height": template.height})


@require_http_methods(["POST"])
@login_required
def api_duplicate_template(request, template_id):
    template = get_object_or_404(InvitationTemplate, pk=template_id)
    if template.owner and template.owner != request.user and not template.is_system:
        return HttpResponseForbidden()
    new_template = InvitationTemplate.objects.create(
        name=f"{template.name} (copie)",
        owner=request.user,
        tags=template.tags,
        width=template.width,
        height=template.height,
        fabric_json=template.fabric_json,
    )
    return JsonResponse({"status": "ok", "template_id": new_template.id})


@require_http_methods(["POST"])
@login_required
def api_render_thumbnail(request, template_id):
    template = get_object_or_404(InvitationTemplate, pk=template_id)
    if template.owner and template.owner != request.user:
        return HttpResponseForbidden()
    payload = json.loads(request.body.decode("utf-8"))
    image_data = payload.get("image")
    if not image_data:
        return HttpResponseBadRequest("Missing image")
    header, encoded = image_data.split(",", 1)
    data = base64.b64decode(encoded)
    template.thumbnail.save(f"template-{template_id}.png", ContentFile(data), save=True)
    return JsonResponse({"status": "ok"})


@require_http_methods(["POST"])
@login_required
def api_generate_invitation_for_guest(request):
    payload = json.loads(request.body.decode("utf-8"))
    guest_id = payload.get("guest_id")
    template_id = payload.get("template_id")
    image_data = payload.get("image")
    if not all([guest_id, template_id, image_data]):
        return HttpResponseBadRequest("Missing data")
    guest = get_object_or_404(Guest, pk=guest_id, event__organizer=request.user)
    template = get_object_or_404(InvitationTemplate, pk=template_id)
    token = InvitationInstance.sign_token(guest.event_id, guest.id)
    invitation, created = InvitationInstance.objects.get_or_create(
        guest=guest,
        defaults={"template": template, "token": token},
    )
    if not created:
        invitation.template = template
        invitation.token = token
    header, encoded = image_data.split(",", 1)
    data = base64.b64decode(encoded)
    invitation.image.save(f"invite-{guest.id}.png", ContentFile(data), save=True)
    invitation.save()
    return JsonResponse({"status": "ok", "token": invitation.token})


@require_http_methods(["POST"])
def api_guest_confirm(request):
    payload = json.loads(request.body.decode("utf-8"))
    token = payload.get("token")
    status = payload.get("status")
    if status not in [Guest.STATUS_CONFIRMED, Guest.STATUS_DECLINED]:
        return HttpResponseBadRequest("Invalid status")
    try:
        data = InvitationInstance.verify_token(token)
    except Exception:
        return HttpResponseBadRequest("Invalid token")
    guest = get_object_or_404(Guest, pk=data["guest_id"], event_id=data["event_id"])
    guest.status = status
    guest.save(update_fields=["status"])
    return JsonResponse({"status": "ok"})


@require_http_methods(["POST"])
@login_required
def api_checkin(request):
    payload = json.loads(request.body.decode("utf-8"))
    token = payload.get("token")
    if not token:
        return HttpResponseBadRequest("Missing token")
    try:
        data = InvitationInstance.verify_token(token)
    except Exception:
        CheckInLog.objects.create(guest=None, scanned_by=request.user, result="invalid", raw_token=token)
        return JsonResponse({"status": "invalid"}, status=400)
    guest = get_object_or_404(Guest, pk=data["guest_id"], event_id=data["event_id"])
    result = "ok"
    if guest.status == Guest.STATUS_CHECKED_IN:
        result = "already_checked_in"
    else:
        guest.status = Guest.STATUS_CHECKED_IN
        guest.save(update_fields=["status"])
    CheckInLog.objects.create(guest=guest, scanned_by=request.user, result=result, raw_token=token)
    return JsonResponse(
        {
            "status": result,
            "guest": {
                "name": f"{guest.first_name} {guest.last_name}",
                "email": guest.email,
                "status": guest.status,
            },
            "checked_in_at": timezone.now().isoformat(),
        }
    )


def invite_view(request, token):
    try:
        data = InvitationInstance.verify_token(token)
    except Exception:
        return render(request, "invite/invalid.html")
    guest = get_object_or_404(Guest, pk=data["guest_id"], event_id=data["event_id"])
    invitation = getattr(guest, "invitation", None)
    qr = qrcode.QRCode(box_size=4, border=2)
    qr.add_data(token)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    qr_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return render(
        request,
        "invite/invite_view.html",
        {"guest": guest, "invitation": invitation, "token": token, "qr_code": qr_base64},
    )


@login_required
def scanner_view(request, event_id):
    event = get_object_or_404(Event, pk=event_id, organizer=request.user)
    logs = CheckInLog.objects.filter(guest__event=event).order_by("-scanned_at")[:20]
    return render(request, "scanner/scanner.html", {"event": event, "logs": logs})
