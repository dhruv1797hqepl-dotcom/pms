from rest_framework.generics import CreateAPIView, ListAPIView
from .models import Client,ExternalTeam
from .serializers import ClientSerializer, ClientListSerializer,ExternalMemberCreateSerializer,ExternalTeamSerializer
from .permissions import IsAdminOrHQEPL
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated,IsAdminUser
from rest_framework.response import Response


class ClientCreateView(CreateAPIView):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    permission_classes = [IsAdminOrHQEPL]

    def get_serializer_context(self):
        return {"request": self.request}


class ClientListView(ListAPIView):
    queryset = Client.objects.all().order_by("-created_at")
    serializer_class = ClientListSerializer
    permission_classes = [IsAdminOrHQEPL]

class ClientExternalMemberView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, client_id):
        members = ExternalTeam.objects.filter(client_org_id=client_id)

        return Response([
            {
                "id": m.user.id,
                "username": m.user.username,
                "email": m.user.email,
                "role": m.user.role
            } for m in members
        ])

    def post(self, request, client_id):
        client = get_object_or_404(Client, id=client_id)

        serializer = ExternalMemberCreateSerializer(
            data=request.data,
            context={"client": client}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            {"message": "External credentials created"},
            status=201
        )

class ExternalTeamCreateView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        serializer = ExternalTeamSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)