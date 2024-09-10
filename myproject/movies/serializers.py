from rest_framework import serializers
from .models import Movie

from rest_framework import serializers
from .models import Movie, Rating, Review, Watched
from djoser.serializers import UserSerializer as BaseUserSerializer


class UserSerializer(BaseUserSerializer):
    class Meta(BaseUserSerializer.Meta):
        fields = BaseUserSerializer.Meta.fields + ('is_superuser',)


class RatingSerializer(serializers.ModelSerializer):
    # Include movie title for easier readability

    movie_title = serializers.ReadOnlyField(source='movie.title')

    class Meta:
        model = Rating
        fields = ['id', 'movie', 'movie_title', 'user', 'rating']
        read_only_fields = ['user']  # User should be set by the view

    def validate(self, data):
        """
        Check that the rating is between 0 and 10.
        """
        rating = data.get('rating')
        if rating < 0 or rating > 10:
            raise serializers.ValidationError("Rating must be between 0 and 10.")
        return data

    def create(self, validated_data):
        """
        Create a new rating instance with validated data.
        """
        return Rating.objects.create(**validated_data)

    def update(self, instance, validated_data):
        """
        Update an existing rating instance with validated data.
        """
        instance.rating = validated_data.get('rating', instance.rating)
        instance.save()
        return instance


class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ['id', 'movie', 'user', 'text', 'like_count']
        read_only_fields = ['user']


class MovieSerializer(serializers.ModelSerializer):
    class Meta:
        model = Movie
        fields = ["id", 'tmdb_id', 'title', 'overview', 'release_date', 'vote_average', 'poster_path', "average_rating"]


class WatchedSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = Watched
        fields = ['user', 'movie', 'watched_at']
