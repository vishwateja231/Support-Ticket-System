from django.urls import path

from .views import (
    HealthCheckView,
    TicketClassifyView,
    TicketListCreateView,
    TicketPartialUpdateView,
    TicketStatsView,
)

urlpatterns = [
    path('tickets/', TicketListCreateView.as_view(), name='ticket-list-create'),
    path('tickets/<int:pk>/', TicketPartialUpdateView.as_view(), name='ticket-partial-update'),
    path('tickets/stats/', TicketStatsView.as_view(), name='ticket-stats'),
    path('tickets/classify/', TicketClassifyView.as_view(), name='ticket-classify'),
    path('health/', HealthCheckView.as_view(), name='health-check'),
]
