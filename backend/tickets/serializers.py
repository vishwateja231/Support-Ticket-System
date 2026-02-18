from rest_framework import serializers

from .models import Ticket


class TicketSerializer(serializers.ModelSerializer):
    """Serializer for creating and listing tickets."""

    class Meta:
        model = Ticket
        fields = [
            'id',
            'title',
            'description',
            'category',
            'priority',
            'status',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def validate_title(self, value):
        """Ensure title is not blank after trimming whitespace."""
        cleaned_value = value.strip()
        if not cleaned_value:
            raise serializers.ValidationError('Title cannot be blank.')
        return cleaned_value

    def validate_description(self, value):
        """Ensure description has a minimum length."""
        cleaned_value = value.strip()
        if len(cleaned_value) < 10:
            raise serializers.ValidationError('Description must be at least 10 characters long.')
        return cleaned_value

    def validate_category(self, value):
        """Ensure category belongs to supported choices."""
        valid_categories = {choice[0] for choice in Ticket.CATEGORY_CHOICES}
        if value not in valid_categories:
            raise serializers.ValidationError('Invalid category value.')
        return value

    def validate_priority(self, value):
        """Ensure priority belongs to supported choices."""
        valid_priorities = {choice[0] for choice in Ticket.PRIORITY_CHOICES}
        if value not in valid_priorities:
            raise serializers.ValidationError('Invalid priority value.')
        return value


class TicketUpdateSerializer(serializers.ModelSerializer):
    """Serializer for partial ticket updates."""

    class Meta:
        model = Ticket
        fields = ['category', 'priority', 'status']

    def validate_category(self, value):
        valid_categories = {choice[0] for choice in Ticket.CATEGORY_CHOICES}
        if value not in valid_categories:
            raise serializers.ValidationError('Invalid category value.')
        return value

    def validate_priority(self, value):
        valid_priorities = {choice[0] for choice in Ticket.PRIORITY_CHOICES}
        if value not in valid_priorities:
            raise serializers.ValidationError('Invalid priority value.')
        return value


class ClassifySerializer(serializers.Serializer):
    """Serializer for LLM classification requests."""

    description = serializers.CharField(min_length=1)
