from django.db.models import Avg, Count, Q
from django.db.models.functions import TruncDate
from rest_framework import generics, status
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView

from .llm import classify_ticket_description
from .models import Ticket
from .serializers import ClassifySerializer, TicketSerializer, TicketUpdateSerializer


class TicketPagination(PageNumberPagination):
    """Pagination settings for ticket list endpoint."""

    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class TicketListCreateView(generics.ListCreateAPIView):
    """Create tickets and list tickets with filtering, ordering, and pagination."""

    queryset = Ticket.objects.all().order_by('-created_at')
    serializer_class = TicketSerializer
    pagination_class = TicketPagination

    def get_queryset(self):
        queryset = super().get_queryset()
        category = self.request.query_params.get('category')
        priority = self.request.query_params.get('priority')
        status_param = self.request.query_params.get('status')
        search = self.request.query_params.get('search')
        ordering = self.request.query_params.get('ordering', 'newest')

        if category:
            queryset = queryset.filter(category=category)
        if priority:
            queryset = queryset.filter(priority=priority)
        if status_param:
            queryset = queryset.filter(status=status_param)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(description__icontains=search)
            )

        if ordering == 'oldest':
            queryset = queryset.order_by('created_at')
        else:
            queryset = queryset.order_by('-created_at')

        return queryset


class TicketPartialUpdateView(generics.UpdateAPIView):
    """Update only selected ticket fields through PATCH requests."""

    queryset = Ticket.objects.all()
    serializer_class = TicketUpdateSerializer
    http_method_names = ['patch']


class TicketStatsView(APIView):
    """Return ticket statistics using ORM aggregations."""

    def get(self, request):
        total_tickets = Ticket.objects.count()
        open_tickets = Ticket.objects.filter(status=Ticket.STATUS_OPEN).count()

        daily_counts = (
            Ticket.objects.annotate(day=TruncDate('created_at'))
            .values('day')
            .annotate(count=Count('id'))
        )
        avg_tickets_per_day = daily_counts.aggregate(avg=Avg('count')).get('avg') or 0.0

        priority_breakdown_qs = Ticket.objects.values('priority').annotate(count=Count('id')).order_by('priority')
        category_breakdown_qs = Ticket.objects.values('category').annotate(count=Count('id')).order_by('category')

        priority_breakdown = {item['priority']: item['count'] for item in priority_breakdown_qs}
        category_breakdown = {item['category']: item['count'] for item in category_breakdown_qs}

        return Response(
            {
                'total_tickets': total_tickets,
                'open_tickets': open_tickets,
                'avg_tickets_per_day': float(avg_tickets_per_day),
                'priority_breakdown': priority_breakdown,
                'category_breakdown': category_breakdown,
            }
        )


class TicketClassifyView(APIView):
    """Classify ticket descriptions using LLM suggestions."""

    def post(self, request):
        serializer = ClassifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = classify_ticket_description(serializer.validated_data['description'])
        return Response(result, status=status.HTTP_200_OK)


class HealthCheckView(APIView):
    """Simple service health check endpoint."""

    def get(self, request):
        return Response({'status': 'ok'}, status=status.HTTP_200_OK)
