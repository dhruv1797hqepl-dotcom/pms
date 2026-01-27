from urllib import request
from xmlrpc import client
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Client,ExternalTeam
from django.db import transaction
from rest_framework.exceptions import ValidationError
import uuid

User = get_user_model()

class ClientSerializer(serializers.ModelSerializer):
    username = serializers.CharField(write_only=True)
    email = serializers.EmailField(write_only=True)   # LOGIN EMAIL
    password = serializers.CharField(write_only=True)

    class Meta:
        model = Client
        fields = [
            "username",
            "email",
            "password",
            "company_name",
            "logo",
            "contact_email",
            "phone",
            "website",
            "address",
            "status",
        ]

    def create(self, validated_data):
        request = self.context.get("request")
    
    # 1. Extract User data
        raw_username = validated_data.pop("username")
        email = validated_data.pop("email")
        password = validated_data.pop("password")

    # 2. Create unique username
        unique_username = f"{raw_username}_{uuid.uuid4().hex[:6]}"
    # Use a transaction to ensure either everything saves or nothing saves
        with transaction.atomic():
        # 3. Create the User
        # Note: Ensure your custom User model actually has a 'role' field
            user = User.objects.create_user(
                username=unique_username,
                email=email,
                password=password,
                # role="client" # Only uncomment if your User model has 'role'
            )
        # 4. Create the Client
        # Safeguard created_by: If admin isn't logged in, set to None
            creator = request.user if request and request.user.is_authenticated else None

            client = Client.objects.create(
                user=user,
                created_by=creator,
            **validated_data
            )

        return client
    
class ClientListSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = Client
        fields = [
            "id",
            "company_name",
            "username",
            "email",
            "contact_email",
            "phone",
            "website",
            "address",
            "logo",
            "status",
            "created_at",
        ]


class ExternalMemberCreateSerializer(serializers.Serializer):
    email = serializers.EmailField()
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def create(self, validated_data):
        client = self.context["client"]

        email = validated_data["email"].lower().strip()
        username = validated_data["username"]
        password = validated_data["password"]
        user, created = User.objects.get_or_create(
            email=email,
            defaults={"username": username}
        )

        if created:
            user.set_password(password)
            user.save()

        # prevent duplicate external member for same client
        if ExternalTeam.objects.filter(user=user, client_org=client).exists():
            raise ValidationError("User already added to this client")

        ExternalTeam.objects.create(
            user=user,
            client_org=client,
            role="client_external"
        )

        return user

    
class ExternalTeamSerializer(serializers.ModelSerializer):
    username = serializers.CharField(write_only=True)
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True)

    class Meta:
        model = ExternalTeam
        fields = [
            "id",
            "client_org",
            "role",
            "username",
            "email",
            "password",
        ]

    def create(self, validated_data):
        username = validated_data.pop("username")
        email = validated_data.pop("email").lower().strip()
        password = validated_data.pop("password")

        user, created = User.objects.get_or_create(
            email=email,
            defaults={"username": username}
        )

        if created:
            user.set_password(password)
            user.save()

        external = ExternalTeam.objects.create(
            user=user,
            role="client_external",
            **validated_data
        )
        return external

