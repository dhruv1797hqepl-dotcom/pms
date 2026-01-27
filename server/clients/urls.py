from django.urls import path
from .views import ClientCreateView, ClientListView,ClientExternalMemberView,  ExternalTeamCreateView

urlpatterns = [
    path('', ClientCreateView.as_view(), name='client_create'),
    path('list/', ClientListView.as_view(), name='client_list'),
    path(
        "<int:client_id>/members/",
        ClientExternalMemberView.as_view(),
        name="client-external-members"
    ),
    path("external-team/", ExternalTeamCreateView.as_view(), name="external_team_create"),


]