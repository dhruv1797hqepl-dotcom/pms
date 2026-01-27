from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import CustomUser
from .serializers import RegisterSerializer, MyTokenObtainPairSerializer
from .permissions import IsAdmin, IsHQEPL, IsSGM, IsEmployee
from .serializers import RegisterSerializer, AdminCreateUserSerializer,AdminListUserSerializer
from rest_framework.permissions import IsAuthenticated

# Register
class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

# Get logged-in user info
class UserDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = RegisterSerializer

    def get_object(self):
        return self.request.user

# JWT Login View
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

# Role-based Views
class AdminOnlyView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    def get(self, request):
        return Response({"message": "Hello Admin!"})

class HQEPLOnlyView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsHQEPL]
    def get(self, request):
        return Response({"message": "Hello HQEPL!"})

class SGMOnlyView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSGM]
    def get(self, request):
        return Response({"message": "Hello SGM!"})

class EmployeeOnlyView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsEmployee]
    def get(self, request):
        return Response({"message": "Hello Employee!"})
    
class AdmincreateuserView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]
    

    def post(self, request, *args, **kwargs):
        serializer = AdminCreateUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {"message": "User created successfully"},
            status=status.HTTP_201_CREATED
        )

class AdminUserListView(generics.ListAPIView):
    queryset=CustomUser.objects.all().order_by('-date_joined')
    serializer_class=AdminListUserSerializer
    permission_classes=[IsAuthenticated, IsAdmin]